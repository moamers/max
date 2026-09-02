import { periodHome, settingsHome, weekHome, yearHome } from "@/lib/routes";
import { FoldLink } from "./FoldLink";
import { foldDirection } from "./scope-fold";

/**
 * The floating bottom navigation pill — Task A.
 *
 * A SHORTCUT PILL, NOT A TAB BAR. The app's model is hub-and-spoke: home is
 * the only place and everything else is a layer over it (`r1-ux-architecture`
 * §5.2). A tab bar claims the opposite — co-equal top-level worlds, each with
 * its own history — so this deliberately isn't one. Every item is a plain link
 * to a route, nothing here holds state, nothing keeps a stack of its own, and
 * deleting this file would leave every screen it appears on working.
 *
 * Four items, left to right: Week · Month · Year · Settings. Home *is* the
 * month view, which is why "Month" points at `/`.
 *
 * ---------------------------------------------------------------------------
 * Colour
 * ---------------------------------------------------------------------------
 * Nothing here decides a colour. The glass, the hairline and the shadow are
 * `.max-nav__bar` in `globals.css` reading tokens from `brand-tokens.css`; the
 * labels read `--text-*`. That is not fussiness: a hardcoded `rgba()` on a
 * control is how the hero's "End of month" segment shipped white-on-white —
 * the contrast suite only sees tokens, so a colour decided in a component is a
 * colour nobody checks. There are two themes with three mode states each and
 * this bar has to be right in all of them, including the un-stamped one where
 * the OS decides in CSS alone.
 *
 * ---------------------------------------------------------------------------
 * Motion
 * ---------------------------------------------------------------------------
 * The press feedback is a CSS transition on `transform` and `background-color`
 * only — no layout property is animated, and no duration is read in
 * JavaScript, so there is no CSS time for `parseFloat` to misread as a third
 * of a millisecond. Durations come from the five-step scale, which is clamped
 * at the token level under `prefers-reduced-motion`, so reduced motion is
 * already handled. The pill deliberately has no entrance animation: it is
 * persistent chrome that re-renders on every navigation, and animating it each
 * time would be a flicker on every tap. Nothing here gates a tap either — the
 * link navigates on press and the transition is decoration that runs alongside.
 *
 * That is also what `data-fold-chrome` on the bar means. A scope change folds
 * the screen under it, and the pill is the one thing that persists across the
 * fold rather than taking part in it: it is cut out of the outgoing screen's
 * photograph so it never appears twice, and it sits outside every
 * `[data-fold-body]` so no transform ever reaches it. See `fold-runtime.ts`.
 */

export type NavDestination = "week" | "month" | "year" | "settings";

/**
 * The pill's geometry, in one place, because three scrolling regions and one
 * FAB have to measure against it. A number that lives in two files is a number
 * that will disagree with itself.
 */
const PILL_HEIGHT = 56;
/** Gap below the pill (above the home indicator) and above it (over content). */
const PILL_INSET = 14;
/** Enough for four words at `--type-label` without crowding on a 393px frame. */
const PILL_MAX_WIDTH = 420;

/**
 * The room a scrolling region or a fixed control must leave beneath it so the
 * pill never covers the thing the user was reading.
 *
 * `extra` is the breathing room that screen already wanted at its bottom — it
 * is added to the pill's own footprint rather than replacing it.
 *
 * `env(safe-area-inset-bottom, 0px)` is the home indicator's height on phones
 * that have one and 0 everywhere else, so one expression is correct in both
 * cases. The `0px` fallback is not decoration: an `env()` reference with no
 * fallback whose variable is undefined makes the whole declaration invalid at
 * computed-value time, which here would drop the shorthand and take the
 * horizontal padding with it. It sits inside the `calc()` so the inset is
 * counted once, in the one expression every caller derives from.
 */
export function navClearance(extra = 0): string {
  return `calc(${PILL_HEIGHT + PILL_INSET * 2 + extra}px + env(safe-area-inset-bottom, 0px))`;
}

export interface BottomNavProps {
  /** Which of the four the current screen is. Gets `aria-current="page"`. */
  active: NavDestination;
  /**
   * The period every item carries. `null` only on an account that owns no
   * period at all — there is then nothing to name, which is not the same
   * failure as failing to name it.
   */
  periodId: number | null;
  /**
   * The week the "Week" item points at: the current week of the selected
   * period (`currentWeekOf`), except on the week screen itself, which passes
   * the week it is showing so the active item points at the page you are on.
   */
  weekNumber: number;
}

export function BottomNav({ active, periodId, weekNumber }: BottomNavProps) {
  const items: { key: NavDestination; label: string; href: string }[] = [
    { key: "week", label: "Week", href: weekHome(weekNumber, periodId) },
    { key: "month", label: "Month", href: periodHome(periodId) },
    { key: "year", label: "Year", href: yearHome(periodId) },
    { key: "settings", label: "Settings", href: settingsHome(periodId) },
  ];

  return (
    <nav
      aria-label="Sections"
      data-fold-chrome=""
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        // Above the page and the FAB, below a sheet and its scrim (z 6): a
        // sheet is a layer over the whole screen, and chrome that floated on
        // top of a scrim would look lit rather than dimmed.
        zIndex: 5,
        display: "flex",
        justifyContent: "center",
        padding: `0 16px calc(${PILL_INSET}px + env(safe-area-inset-bottom, 0px))`,
        // The bar is the only thing here that should catch a press; the strip
        // of page either side of it must stay scrollable and tappable.
        pointerEvents: "none",
      }}
    >
      <div
        className="max-nav__bar"
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "stretch",
          gap: 2,
          width: "100%",
          maxWidth: PILL_MAX_WIDTH,
          height: PILL_HEIGHT,
          padding: 5,
          borderRadius: "var(--radius-pill)",
        }}
      >
        {items.map((item) => {
          const current = item.key === active;
          return (
            <FoldLink
              key={item.key}
              href={item.href}
              className="max-nav__item"
              /*
                The direction this item travels, which is what turns a route
                change into a fold. Widening out to a longer span and narrowing
                back are mirror images, so "back" retraces rather than playing a
                second, unrelated animation. Settings is a layer rather than a
                scope and gets no direction — see scope-fold.ts.
              */
              direction={foldDirection(active, item.key)}
              aria-current={current ? "page" : undefined}
              style={{
                flex: "1 1 0",
                // 44x44 is the floor for a hit target; the bar's 56px height
                // less its 5px padding leaves 46, and four items across a
                // 393px frame leave ~95 each.
                minWidth: 44,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-pill)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                fontSize: "var(--type-label)",
                fontWeight: current ? 700 : 600,
                letterSpacing: "-0.01em",
                // Current state is carried by three things, not by colour
                // alone: a filled capsule, a heavier weight, and aria-current.
                color: current ? "var(--text-primary)" : "var(--text-tertiary)",
                background: current ? "var(--control-active)" : "transparent",
              }}
            >
              {item.label}
            </FoldLink>
          );
        })}
      </div>
    </nav>
  );
}
