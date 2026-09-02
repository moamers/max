"use client";

import { easingToken, motionToken, prefersReducedMotion } from "@/lib/motion";
import { NAV_PAINTED_HEIGHT } from "./nav-geometry";
import { FOLD_BODY, FOLD_CHROME, FOLD_SCREEN, foldScales, type FoldDirection } from "./scope-fold";

/**
 * THE FOLD, hand-rolled.
 *
 * ---------------------------------------------------------------------------
 * Why this is not `<ViewTransition>`
 * ---------------------------------------------------------------------------
 * It was, and it did nothing. Measured in a browser on Next 16.3.0 / React
 * 19.2.8 by hooking the method and counting calls, a scope change called
 * `document.startViewTransition` ZERO times — so no `::view-transition-*` rule
 * could ever apply. Browser support, the React exports, Next forwarding
 * `transitionTypes`, and the wrapper's position in the tree were all ruled out
 * one at a time; the remaining difference is that Next's compiled stable
 * `react-dom` carries roughly half the references to `startViewTransition`
 * that the experimental build does. There is no supported config flag for
 * that, and a moment that depends on one is not shipped.
 *
 * So the browser is not asked to hold the old screen. This holds it instead.
 *
 * ---------------------------------------------------------------------------
 * The shape of it
 * ---------------------------------------------------------------------------
 * A route change destroys the outgoing screen before the incoming one exists,
 * which is the whole difficulty: there is nothing left to animate out. The
 * answer is to take a photograph before letting go.
 *
 *   1. On the press, `captureFold()` clones the live screen, strips the chrome
 *      that persists, and lays the clone over the top. The user sees no change
 *      — it is a copy of what is already there — and it covers the gap however
 *      long the navigation takes.
 *   2. When the pathname actually changes, `playFold()` fades the clone out
 *      over the new screen and folds the new screen's body in behind it.
 *
 * Out finishes before in starts: the clone leaves over `--motion-quick`, the
 * new body arrives over `--motion-standard` delayed by the whole of that exit.
 * No frame paints two screens at once, so nothing cross-dissolves — the
 * prototype's Week-to-Year cross-fade read as double vision and is recorded as
 * a defect in Task E.
 *
 * ---------------------------------------------------------------------------
 * What is deliberately NOT animated
 * ---------------------------------------------------------------------------
 * The nav pill. It is persistent chrome, it re-renders on every navigation,
 * and animating it each time is a flicker on every tap. That is also why the
 * fold lands on `[data-fold-body]` and not on the screen root: a transform on
 * an ancestor scales and fades everything under it, the pill included, and a
 * `position: fixed` descendant of a transformed element is positioned against
 * that element rather than the viewport. Marking the body explicitly keeps the
 * pill out of both problems.
 *
 * Nothing here animates a layout property — opacity and transform only, on
 * both sides — and every duration is read through `motionToken()`, which
 * carries the unit. `parseFloat` on a minified `.32s` is a third of a
 * millisecond, and that is how a whole layer of motion once shipped invisible.
 *
 * Reduced motion is handled at the top: no photograph is taken, so the scope
 * change is a cut rather than a 1ms flinch.
 */

interface Pending {
  direction: FoldDirection;
  /** The photograph of the outgoing screen, already in the document. */
  ghost: HTMLElement;
  /** Cleared when the fold plays; fires if the navigation never arrives. */
  timer: number;
}

/*
  Module scope, not a ref or a context. The two halves of a fold happen either
  side of a route change, and every React tree that could hold this is torn
  down in between — which is the same reason the Landing's flight lives on
  `document.body`. The module outlives the navigation; nothing else does.
*/
let pending: Pending | null = null;

/** Tear down whatever is held, whether or not it ever got to play. */
export function discardFold(): void {
  if (!pending) return;
  window.clearTimeout(pending.timer);
  pending.ghost.remove();
  pending = null;
}

/** Whether a photograph is currently being held. Exists for the tests. */
export function foldIsPending(): boolean {
  return pending !== null;
}

/**
 * Photograph the screen being left, and hold it over the top.
 *
 * Called on the press, before the navigation starts — the outgoing DOM is
 * still there, and this is the last moment it exists.
 */
export function captureFold(direction: FoldDirection | null): void {
  if (direction === null) return;
  if (typeof document === "undefined") return;
  if (prefersReducedMotion()) return;

  // A second press before the first fold played: the older photograph is of a
  // screen two navigations ago and would be a lie.
  discardFold();

  const screen = document.querySelector(`[${FOLD_SCREEN}]`);
  if (!(screen instanceof HTMLElement)) return;
  const rect = screen.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const ghost = screen.cloneNode(true) as HTMLElement;
  // The pill is the one thing on both sides of the fold. Left in, it would
  // appear twice and one of the two would scale away.
  ghost.querySelectorAll(`[${FOLD_CHROME}]`).forEach((node) => node.remove());
  ghost.removeAttribute(FOLD_SCREEN);
  ghost.setAttribute("data-fold-ghost", "");
  // It is a picture, not a screen: out of the accessibility tree, out of the
  // tab order, and it does not swallow the press that follows it.
  ghost.setAttribute("aria-hidden", "true");
  ghost.setAttribute("inert", "");

  /*
    Cut the pill's strip out of the photograph.

    The pill is chrome that persists, so the outgoing screen must not pass in
    front of it — and it was. Every screen root is `position: fixed`, which in
    Chrome makes it a stacking context, so the pill's `z-index: 5` is sealed
    inside its own screen and cannot rise above a photograph sitting on
    `document.body`. The pill therefore spent the whole 140ms exit under a
    fading veil, which is what "the navigation hides and then comes back" is.

    Masking is the cheap half of the fix and the honest one: what it removes
    is the strip the pill is already covering, so nothing legible is lost. It
    is deliberately the pill's PAINTED height and not `navClearance()` — the
    clearance also reserves the gap above the bar, and masking that would
    erase a band of real content the pill never hides. The 14px ramp makes the
    cut a fade rather than an edge.

    Measured from the VIEWPORT bottom, not the ghost's own: three of the four
    scope screens are `inset: 0` and the week screen is not.
  */
  const bottomGap = Math.max(0, window.innerHeight - rect.bottom);
  const opaqueFrom = Math.max(0, NAV_PAINTED_HEIGHT - bottomGap);
  const mask = `linear-gradient(to top, transparent 0, transparent ${opaqueFrom}px, #000 ${opaqueFrom + 14}px)`;

  Object.assign(ghost.style, {
    // Pinned to where the real screen was, measured rather than assumed —
    // three of the four scope screens are `fixed; inset: 0` and the week
    // screen is not.
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    // Under the nav pill (5) and under a sheet and its scrim (6), over the page.
    zIndex: "4",
    pointerEvents: "none",
    transformOrigin: "50% 50%",
    maskImage: mask,
    webkitMaskImage: mask,
  } satisfies Partial<CSSStyleDeclaration>);

  document.body.appendChild(ghost);

  // Scroll offsets are state, not markup, so a clone starts at the top. A
  // photograph of the top of a screen the user had scrolled halfway down is
  // worse than no photograph. Set after appending — a detached node cannot
  // scroll.
  const live = screen.querySelectorAll(`[${FOLD_BODY}]`);
  const copies = ghost.querySelectorAll(`[${FOLD_BODY}]`);
  live.forEach((node, index) => {
    const copy = copies[index];
    if (!copy) return;
    copy.scrollTop = node.scrollTop;
    /*
      Then stop being a body. `playFold` folds in every `[data-fold-body]` in
      the document, and the photograph contains one of its own — so the copy
      was being animated as though it were the arriving screen, which meant it
      sat at opacity 0 for the whole of its own exit. The fold ran perfectly
      and photographed an empty room.
    */
    copy.removeAttribute(FOLD_BODY);
  });

  // If the navigation never lands — it failed, or the user went somewhere else
  // entirely — the photograph must not sit on the screen forever.
  const timer = window.setTimeout(discardFold, motionToken("--motion-dwell") || 2000);
  pending = { direction, ghost, timer };
}

/**
 * The new screen has committed. Fade the photograph out and fold the new body
 * in behind it.
 *
 * A no-op when nothing was captured, which is every navigation that is not a
 * scope change — and every scope change reached by browser back, which does
 * not pass through a link and so has no press to photograph on. That is a
 * plain cut, and a cut is an honest answer to a gesture the app never saw.
 */
export function playFold(): void {
  const held = pending;
  if (!held) return;
  window.clearTimeout(held.timer);
  pending = null;

  const { ghost, direction } = held;
  const { leaves, arrives } = foldScales(direction);
  const exitFor = motionToken("--motion-quick");
  const enterFor = motionToken("--motion-standard");
  const exit = easingToken("--ease-exit");
  const enter = easingToken("--ease-enter");

  const remove = () => ghost.remove();
  const leaving = ghost.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: `scale(${leaves})` },
    ],
    { duration: exitFor, easing: exit, fill: "forwards" }
  );
  leaving.finished.then(remove, remove);

  /*
    `fill: "backwards"` is what keeps this safe with no forced reflow: the
    from-keyframe applies the moment the animation is constructed, so the new
    body is already invisible before the browser paints anything — there is
    never a frame showing it un-folded underneath the photograph.
  */
  document.querySelectorAll(`[${FOLD_BODY}]`).forEach((node) => {
    node.animate(
      [
        { opacity: 0, transform: `scale(${arrives})` },
        { opacity: 1, transform: "none" },
      ],
      { duration: enterFor, delay: exitFor, easing: enter, fill: "backwards" }
    );
  });
}
