"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { playFold } from "./fold-runtime";

/**
 * The half of the fold that happens after the route change.
 *
 * It renders nothing of its own. Its only job is to notice that the pathname
 * changed and, if a scope link photographed the outgoing screen on the way
 * out, play that photograph off while the new screen folds in.
 *
 * It lives in the root layout because that is the only component that survives
 * a route change. The previous attempt put React's ViewTransition wrapper
 * here and it never fired; `fold-runtime.ts` records what was measured and why
 * this is hand-rolled instead.
 *
 * `useLayoutEffect`, not `useEffect`: the fold sets the new body's opacity to
 * zero for the length of the outgoing exit, and that has to be true before the
 * browser paints the new screen. A frame of the new screen at full opacity,
 * followed by it disappearing to fold in, is a flash.
 *
 * The ref guards against StrictMode's double invocation — the same bug that
 * once stranded the arrival overlay over the home screen, where the first pass
 * animated and the second tore the result down.
 */
export function ScopeFold({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const played = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (played.current === pathname) return;
    played.current = pathname;
    playFold();
  }, [pathname]);

  return <>{children}</>;
}
