"use client";

import Link from "next/link";
import { captureFold } from "./fold-runtime";
import type { FoldDirection } from "./scope-fold";

/**
 * A nav item that photographs the screen it is leaving.
 *
 * The capture has to happen while the outgoing DOM still exists, and the last
 * moment that is true is the press itself — by the time any effect runs after
 * the navigation, React has already replaced the tree. So the one thing this
 * adds to a plain `<Link>` is an `onClick` that runs before the router does.
 *
 * Nothing here gates the navigation. `captureFold` does not await, does not
 * preventDefault, and returns immediately when there is no direction to travel
 * in or the user has asked for reduced motion; if it fails for any reason the
 * link still goes where it says it goes, without a fold.
 *
 * `onClick` rather than `onPointerDown` on purpose: a pointer down that turns
 * into a scroll is not a navigation, and photographing on it would leave a
 * still image over a screen the user is still moving.
 */
export interface FoldLinkProps extends React.ComponentProps<typeof Link> {
  /** Which way this link travels, or null when it is not a scope change. */
  direction: FoldDirection | null;
}

export function FoldLink({ direction, onClick, ...props }: FoldLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        captureFold(direction);
        onClick?.(event);
      }}
    />
  );
}
