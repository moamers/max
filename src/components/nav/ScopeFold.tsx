"use client";

import { ViewTransition } from "react";

/**
 * Wraps a scope screen's content so it folds in the direction of travel.
 *
 * The problem this solves is structural, not decorative. The motion prototype
 * was a single page: Week, Month and Year lived in one DOM, so a figure could
 * physically travel between them. This app renders each scope as its own
 * route, and the outgoing screen is gone before the incoming one exists —
 * nothing can move across that gap by accident.
 *
 * React's `<ViewTransition>` closes the gap: the browser captures the old
 * page, React commits the new one, and the two are animated between. The
 * direction comes from the transition type the nav link tagged the navigation
 * with, so widening out and narrowing back are mirror images by construction
 * rather than by two hand-written animations that have to be kept in step.
 *
 * `default="none"` matters: without it this animates on EVERY transition in
 * the app, including opening a tape or landing an amount, and the screen would
 * fold every time anything moved.
 *
 * Durations and easings live in `globals.css` under `::view-transition-*`,
 * reading the same five-step scale as everything else — which also means
 * reduced motion is already handled, because those tokens clamp to 1ms.
 *
 * ---------------------------------------------------------------------------
 * THIS DOES NOT FIRE YET. Read before assuming it works.
 * ---------------------------------------------------------------------------
 * Measured in a browser on Next 16.3.0 / React 19.2.8: navigating between
 * scopes calls `document.startViewTransition` ZERO times. Not "the animation
 * looks wrong" — the browser transition is never started, so no `::view-
 * transition-*` rule can apply and none of the CSS below matters.
 *
 * What was checked, so the next attempt does not repeat it:
 *   · `document.startViewTransition` exists in the browser (it is a function).
 *   · `ViewTransition` and `addTransitionType` are both exported by the React
 *     that Next bundles, on the stable AND experimental channels.
 *   · Next's Link really does forward `transitionTypes` into
 *     `addTransitionType` — `app-router-instance.js` does exactly that.
 *   · The wrapper is a single instance in the root layout, not one per route.
 *     Three separate wrappers gave React nothing to pair; that was a real bug
 *     and fixing it changed nothing here.
 *
 * The remaining suspect is the renderer: Next's compiled stable `react-dom`
 * carries 10 references to `startViewTransition` against 19 in
 * `react-dom-experimental`, which suggests the component is a passthrough
 * without the experimental channel. No supported config flag for switching
 * channels was found in `config-schema` or `config-shared`.
 *
 * Everything around this still earns its place either way: `foldDirection()`
 * decides which way a scope change travels, the keyframes describe what the
 * fold looks like, and the nav already tags each link. A hand-rolled FLIP —
 * `flyAmountToItsRow()` in `src/lib/motion.ts` already flies a node across a
 * route change in this app — would reuse all of it and replace only this file.
 */
export function ScopeFold({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      default="none"
      enter={{ "scope-out": "fold-out", "scope-in": "fold-in", default: "none" }}
      exit={{ "scope-out": "fold-out", "scope-in": "fold-in", default: "none" }}
    >
      {children}
    </ViewTransition>
  );
}
