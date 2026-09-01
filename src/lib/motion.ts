/**
 * Reading a duration token from CSS, without getting the unit wrong.
 *
 * `parseFloat` on a CSS time is a trap. The stylesheet says `320ms`, but the
 * build's CSS minifier normalises that to the shorter `.32s`, and
 * `parseFloat(".32s")` is `0.32`. Used as milliseconds that is a third of a
 * millisecond — an animation that technically runs and is over before a single
 * frame. Every moment built this way looked like nothing happening at all,
 * which is indistinguishable from not having built it.
 *
 * So the unit is read, not assumed. Both spellings are legal CSS and either
 * may come back depending on whether the stylesheet was minified.
 */
export function cssTimeMs(value: string): number {
  const text = value.trim();
  if (text === "") return 0;
  const amount = parseFloat(text);
  if (!Number.isFinite(amount)) return 0;
  if (text.endsWith("ms")) return amount;
  if (text.endsWith("s")) return amount * 1000;
  // A bare number in a time token is a mistake, but treating it as
  // milliseconds matches what the author of `320` would have meant.
  return amount;
}

/** The computed value of a custom property on the document root. */
export function motionToken(name: string, root: Element = document.documentElement): number {
  return cssTimeMs(getComputedStyle(root).getPropertyValue(name));
}

/**
 * A named easing curve, read from the same place for the same reason. There
 * are three of them and nothing may invent a fourth.
 */
export function easingToken(name: string, fallback = "ease"): string {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/**
 * Read at animation time, never at mount, so someone who turns the setting on
 * mid-session gets the right behaviour on their next interaction rather than
 * on their next page load.
 *
 * Almost nothing needs this. All five duration tokens clamp to 1ms under
 * `prefers-reduced-motion`, so using the tokens handles the whole scale with
 * no branch — that is the point of clamping at the token level. It exists for
 * the one case where "1ms" is the wrong answer and "do not do this at all" is
 * the right one: an element that flies across the screen, whose start is gated
 * on a network round trip and so cannot simply be made short.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------- FLIP */

/**
 * Everything that sits below `node` in the flow, and therefore moves when
 * `node` changes height: its own later siblings, then its parent's later
 * siblings, and so on up to whatever actually scrolls.
 *
 * Walking up is the part that matters. A panel opening inside a card pushes
 * the rest of that card down AND every card after it; stopping at the first
 * parent would leave half the screen animating and the other half jumping.
 */
export function elementsBelow(node: Element, maxDepth = 8): HTMLElement[] {
  const out: HTMLElement[] = [];
  let current: Element | null = node;
  for (let depth = 0; current && depth < maxDepth; depth += 1) {
    for (let next = current.nextElementSibling; next; next = next.nextElementSibling) {
      if (!(next instanceof HTMLElement)) continue;
      // Taken out of the flow, so it did not move and must not be moved. The
      // month panel's pointer is exactly this: an absolutely positioned
      // sibling of the rows, which would otherwise fly off the card.
      const position = getComputedStyle(next).position;
      if (position === "absolute" || position === "fixed") continue;
      out.push(next);
    }
    const parent: HTMLElement | null = current.parentElement;
    if (!parent || parent === document.body) break;
    const style = getComputedStyle(parent);
    // A scroll container ends the run: what is past it is not in the same
    // flow, and translating it would drag the frame rather than the content.
    if (/(auto|scroll)/.test(style.overflowY) || style.position === "fixed") break;
    current = parent;
  }
  return out;
}

/**
 * The FLIP for a layout change. The box has ALREADY taken its new height; this
 * puts everything that moved back where it was, and releases it.
 *
 * Nothing animates `height`. It does not animate from `auto` at all, and
 * animated between two measured values it relayouts every frame — which is the
 * difference between a moment that holds 60fps and one the founder calls
 * laggy. So the height is *set*, once, and the displacement it caused is
 * played back on `transform`.
 *
 * `fill: "backwards"` is what makes this safe with no forced reflow: the
 * from-keyframe applies from the moment the animation is constructed, which is
 * before it starts running on the next frame. There is never a painted frame
 * showing the new layout un-inverted.
 */
export function playInverseTranslate(
  nodes: Iterable<Element>,
  distance: number,
  duration: number,
  easing: string
): Animation[] {
  return [...nodes].map((node) =>
    node.animate([{ transform: `translateY(${-distance}px)` }, { transform: "none" }], {
      duration,
      easing,
      fill: "backwards",
    })
  );
}

/**
 * The inverse: from where things are now, up to where the collapse is about to
 * put them. Held with `fill: "forwards"` until the panel actually leaves the
 * flow, so the two never disagree for a frame.
 */
export function playCollapseTranslate(
  nodes: Iterable<Element>,
  distance: number,
  duration: number,
  easing: string
): Animation[] {
  return [...nodes].map((node) =>
    node.animate([{ transform: "none" }, { transform: `translateY(${-distance}px)` }], {
      duration,
      easing,
      fill: "forwards",
    })
  );
}

/* ---------------------------------------------------------------- LANDING */

/** The attribute the destination row carries — see `ui/JustChanged.tsx`. */
export const LANDING_TARGET = "data-landing-target";

export interface Flight {
  /** Finish to the end state on the next frame. Safe to call more than once. */
  cancel(): void;
}

interface FlightOptions {
  /** The element the amount is leaving — measured once, never moved. */
  from: Element;
  /** Exactly the glyphs on screen. Formatted by the caller; this never formats money. */
  text: string;
}

/**
 * THE LANDING — an amount that has just been added travels to the row it
 * belongs to.
 *
 * Adding money is the one moment where the user has done something and needs
 * to see where it went. Before this, the add sheet committed and the
 * destination screen simply appeared with a different number on it; the only
 * thing connecting the two was the user's memory of what they had typed.
 *
 * The flight is a plain DOM node on `document.body`, deliberately outside
 * React. It has to outlive the screen it left — `router.replace` unmounts the
 * add sheet — and a React subtree cannot survive its own unmount. The node
 * owns its whole life and removes itself.
 *
 * The shape of it, and why:
 *
 *  · It launches at t = 0, on the release of Add it, BEFORE the write is
 *    awaited. Zero milliseconds of it blocks, and it does not know or care
 *    whether the write succeeded — `cancel()` is how a failure clears it.
 *  · It cannot know where it is going yet: the destination screen has not
 *    rendered. So it lifts first, and waits for `[data-landing-target]` to
 *    appear — the row the destination screen has already marked as the one
 *    that just changed. The Landing composes with that mark rather than
 *    inventing a second way to find the same row.
 *  · The arc is two curves on two axes — X on `--ease-standard`, Y on
 *    `--ease-enter` — which bends the path with no path maths and no library.
 *  · The row's figure does not tween. It is server-rendered at its true value
 *    and simply is that value when the chip lands. A number counting up is a
 *    number nobody can read, in a product whose parser has misread real data
 *    twice (D-5).
 *  · The haptic fires on the consequence — the landing — not on the tap.
 *  · Nothing here gates anything: the layer is `pointer-events: none`, and the
 *    first pointer or key input finishes it to its end state.
 *
 * Under reduced motion there is no flight at all. Every duration token clamps
 * to 1ms, but this one waits on a server round trip before it can start, so
 * clamping would leave a chip parked on screen for as long as the write takes
 * and then blink. The `.just-changed` mark on its own already points the eye
 * at the row, which is what the flight is for.
 */
export function flyAmountToItsRow({ from, text }: FlightOptions): Flight | null {
  if (typeof document === "undefined") return null;
  if (prefersReducedMotion()) return null;

  const origin = from.getBoundingClientRect();
  if (origin.width === 0 && origin.height === 0) return null;

  /*
    The type comes from the element that actually carries it, not from the box
    that positions it. `[data-motion-amount]` is the `£` and the field side by
    side; the box itself inherits the sheet's 16px body type, so reading it
    would launch a ghost less than half the size of the figure it left — a
    thing that looks like a different number rather than the same one.
  */
  const source = getComputedStyle(from.firstElementChild ?? from);
  const lift = motionToken("--motion-standard");
  const travel = motionToken("--motion-deliberate");
  const land = motionToken("--motion-quick");
  const budget = motionToken("--motion-dwell");
  const standard = easingToken("--ease-standard");
  const enter = easingToken("--ease-enter");
  const exit = easingToken("--ease-exit");

  const layer = document.createElement("div");
  layer.setAttribute("data-motion-flight", "");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, {
    position: "fixed",
    left: `${origin.left + origin.width / 2}px`,
    top: `${origin.top + origin.height / 2}px`,
    width: "0",
    height: "0",
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
    zIndex: "60",
  } satisfies Partial<CSSStyleDeclaration>);

  // Three nested boxes so three transforms compose without fighting: X, then
  // Y, then scale. One element cannot hold two `transform` animations on two
  // different curves, which is exactly what the arc needs.
  const x = document.createElement("div");
  const y = document.createElement("div");
  const scale = document.createElement("div");
  const glyphs = document.createElement("span");
  glyphs.textContent = text;
  Object.assign(glyphs.style, {
    display: "block",
    whiteSpace: "nowrap",
    fontFamily: source.fontFamily,
    fontSize: source.fontSize,
    fontWeight: source.fontWeight,
    letterSpacing: source.letterSpacing,
    fontVariantNumeric: "tabular-nums",
    color: source.color,
  } satisfies Partial<CSSStyleDeclaration>);
  scale.appendChild(glyphs);
  y.appendChild(scale);
  x.appendChild(y);
  layer.appendChild(x);
  document.body.appendChild(layer);

  let done = false;
  const running: Animation[] = [];
  let observer: MutationObserver | null = null;
  let timer: number | null = null;
  let marked: Element | null = null;

  const release = () => {
    // The mark on the destination row holds still while the chip is in the
    // air, so its two-second fade starts when the chip arrives rather than
    // when the screen did. See `.just-changed` in globals.css.
    if (marked) marked.removeAttribute("data-landing");
    marked = null;
  };

  const teardown = () => {
    if (done) return;
    done = true;
    observer?.disconnect();
    if (timer !== null) window.clearTimeout(timer);
    release();
    running.forEach((animation) => {
      try {
        animation.cancel();
      } catch {
        /* already gone */
      }
    });
    layer.remove();
    window.removeEventListener("pointerdown", teardown, true);
    window.removeEventListener("keydown", teardown, true);
  };

  window.addEventListener("pointerdown", teardown, { capture: true });
  window.addEventListener("keydown", teardown, { capture: true });

  // It lifts out of the form immediately, at full opacity. Leaving is not what
  // is being said here — arriving is — so it does not fade on the way out.
  running.push(
    scale.animate([{ transform: "none" }, { transform: "scale(0.72)" }], {
      duration: lift,
      easing: standard,
      fill: "forwards",
    })
  );

  const arrive = (target: Element) => {
    if (done) return;
    observer?.disconnect();
    observer = null;
    if (timer !== null) window.clearTimeout(timer);
    timer = null;

    // A row below the fold would be flown to off-screen. Scrolling is not
    // animated and is not on the motion scale — it is the screen putting the
    // destination where the destination has to be before anything moves.
    const first = target.getBoundingClientRect();
    if (first.top < 0 || first.bottom > window.innerHeight) {
      target.scrollIntoView({ block: "center", behavior: "auto" });
    }
    const rect = target.getBoundingClientRect();
    marked = target;
    target.setAttribute("data-landing", "incoming");

    const dx = rect.left + rect.width / 2 - (origin.left + origin.width / 2);
    const dy = rect.top + rect.height / 2 - (origin.top + origin.height / 2);

    running.push(
      x.animate([{ transform: "none" }, { transform: `translateX(${dx}px)` }], {
        duration: travel,
        easing: standard,
        fill: "forwards",
      })
    );
    const flight = y.animate([{ transform: "none" }, { transform: `translateY(${dy}px)` }], {
      duration: travel,
      easing: enter,
      fill: "forwards",
    });
    running.push(flight);

    flight.finished.then(() => {
      if (done) return;
      // The consequence, not the input. 18ms, once, and never on going over a
      // budget — the app does not flinch in your hand about money.
      try {
        navigator.vibrate?.(18);
      } catch {
        /* not supported, and nothing depends on it */
      }
      release();
      const out = scale.animate(
        [
          { transform: "scale(0.72)", opacity: 1 },
          { transform: "scale(0)", opacity: 0 },
        ],
        { duration: land, easing: exit, fill: "forwards" }
      );
      running.push(out);
      out.finished.then(teardown, teardown);
    }, teardown);
  };

  const found = document.querySelector(`[${LANDING_TARGET}]`);
  if (found) {
    arrive(found);
  } else {
    observer = new MutationObserver(() => {
      const target = document.querySelector(`[${LANDING_TARGET}]`);
      if (target) arrive(target);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // If the destination never marks a row — a weekly row with no week has no
    // week screen to land on — the chip does not hang about waiting forever.
    timer = window.setTimeout(teardown, budget);
  }

  return { cancel: teardown };
}
