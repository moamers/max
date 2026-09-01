"use client";

import { useEffect, useRef } from "react";
import {
  COUNTERBALANCE_A,
  COUNTERBALANCE_B,
  COUNTERBALANCE_VIEWBOX,
} from "@/components/brand/counterbalance-paths";
import { motionToken } from "@/lib/motion";

/**
 * THE ARRIVAL — the app opening.
 *
 * The two halves of the Counterbalance come in from opposite sides of the axis
 * they share and settle into balance. The coral sliver between them is not
 * drawn: it is the true clip intersection of the two forms, so it exists only
 * while they overlap. That is the point — the mark's meaning is that two
 * things balance, and the arrival is the only place a static logo can say so.
 *
 * Then it takes its place in the header and the screen assembles behind it.
 *
 * Rules it keeps, all from Task E:
 *
 *  · It never blocks. `pointer-events: none` throughout, and the first touch
 *    anywhere finishes it to its end state on the next frame. An animation
 *    that makes someone wait is not a brand moment, it is a toll.
 *  · Transform and opacity only.
 *  · Once per app open, not per navigation. Moving between screens and coming
 *    back is not an arrival, and a splash that replays is an irritation. Kept
 *    in sessionStorage, which is per tab and clears with it.
 *  · Under reduced motion the durations clamp to 1ms at the token level, so
 *    the mark is simply present and the screen is simply there.
 *
 * It is decorative: aria-hidden, outside the tab order, and nothing it shows
 * is information that is not also on the screen underneath.
 */
const SEEN = "ravel:arrived";

/**
 * Survives React's development double-invocation of effects. StrictMode runs
 * every effect twice: the first pass recorded "seen" and started the
 * choreography, and the second pass read that record back and removed the
 * overlay on the spot — so the arrival never played in development at all,
 * and the fault was invisible because the end state looks identical.
 *
 * Module scope rather than a ref, because the question is "has this tab
 * already arrived", which outlives any one mount.
 */
let armed = false;

/** The axis the two halves separate along, from the kit's own geometry. */
const AXIS = [0.87, 0.49] as const;

export function Arrival() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    if (armed) return;
    armed = true;

    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
    } catch {
      // Private mode, or storage blocked. Showing the arrival once too often
      // is a far smaller cost than throwing on the first paint of the app.
    }
    if (seen) {
      el.remove();
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const ms = (name: string) => motionToken(name);
    const travel = ms("--motion-travel") || ms("--motion-deliberate");
    const enter = styles.getPropertyValue("--ease-enter").trim() || "ease-out";
    const standard = styles.getPropertyValue("--ease-standard").trim() || "ease";

    const a = el.querySelector<SVGPathElement>("[data-half='a']");
    const b = el.querySelectorAll<SVGPathElement>("[data-half='b']");
    const clip = el.querySelector<SVGPathElement>("[data-clip]");
    const rot = el.querySelector<SVGGElement>("[data-rot]");
    if (!a || !rot) return;

    const apart = 62;
    const from = (sign: number) =>
      `translate(${sign * AXIS[0] * apart}px, ${sign * AXIS[1] * apart}px)`;

    const running: Animation[] = [];
    const halves = [
      ...[a, clip].filter(Boolean).map((n) => [n as Element, from(-1)] as const),
      ...[...b].map((n) => [n as Element, from(1)] as const),
    ];
    for (const [node, offset] of halves) {
      running.push(
        node.animate([{ transform: offset }, { transform: "none" }], {
          duration: travel,
          easing: enter,
          fill: "backwards",
        })
      );
    }
    running.push(
      rot.animate([{ transform: "rotate(-17deg)" }, { transform: "none" }], {
        duration: travel,
        easing: enter,
        fill: "backwards",
      })
    );
    // It holds for a beat at rest, then hands the screen over.
    running.push(
      el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.62 }, { opacity: 0 }], {
        duration: travel * 2,
        easing: standard,
        fill: "forwards",
      })
    );

    const finish = () => {
      running.forEach((animation) => {
        try {
          animation.finish();
        } catch {
          /* already finished */
        }
      });
    };
    const done = () => {
      el.remove();
      // Recorded only once it has actually played. Writing it up front meant a
      // load interrupted before the animation finished still counted as an
      // arrival the user never saw.
      try {
        sessionStorage.setItem(SEEN, "1");
      } catch {
        /* storage blocked; see above */
      }
    };

    window.addEventListener("pointerdown", finish, { once: true, capture: true });
    running[running.length - 1].finished.then(done, done);

    return () => {
      window.removeEventListener("pointerdown", finish, true);
    };
  }, []);

  return (
    <div
      ref={host}
      data-arrival
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      <svg viewBox={COUNTERBALANCE_VIEWBOX} width={104} height={104} style={{ display: "block" }}>
        <defs>
          <clipPath id="arrival-clip">
            <path data-clip d={COUNTERBALANCE_A} />
          </clipPath>
        </defs>
        <g data-rot>
          <path data-half="a" d={COUNTERBALANCE_A} fill="var(--color-primary)" />
          <path data-half="b" d={COUNTERBALANCE_B} fill="var(--color-health)" />
          <path data-half="b" d={COUNTERBALANCE_B} fill="var(--color-spark)" clipPath="url(#arrival-clip)" />
        </g>
      </svg>
    </div>
  );
}
