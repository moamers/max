"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { formatMoney } from "@/lib/money";
import {
  easingToken,
  elementsBelow,
  motionToken,
  playCollapseTranslate,
  playInverseTranslate,
} from "@/lib/motion";
import type { TapeBlock } from "./tape-grammar";

/**
 * THE TAPE — any figure the app states can open its own evidence, underneath
 * it, without the figure moving.
 *
 * The rule that makes it read as an object you opened rather than a widget
 * that reacted: **the figure does not move.** Not a pixel, not a scale, not a
 * colour change. Everything that happens happens below it.
 *
 * ---- the technique: a FLIP for a height change ----
 *
 * Nothing may animate `height`. It does not animate from `auto` at all, and
 * animated between two measured values it relayouts on every frame. So:
 *
 *  1. FIRST — before React is told anything, the top of the first element
 *     BELOW the tape is measured. One `getBoundingClientRect`, synchronous,
 *     inside the click handler, outside any rAF.
 *  2. The panel is rendered and takes its natural height instantly. The layout
 *     pushes.
 *  3. LAST — in a layout effect, before a single frame is painted, the same
 *     element is measured again. The difference is the displacement.
 *  4. Everything that moved is put back where it was with a transform and then
 *     released, all on one duration and one curve. One motion, not two.
 *
 * The displacement is measured rather than taken from the panel's own height
 * because the panel usually sits in a flex column with a `gap`: the content
 * below moves by the panel's height PLUS a gap it never sees. Using the
 * panel's height would leave everything below landing a few pixels off, every
 * time, which reads as a bounce.
 *
 * The panel clips its own contents, and they start at the same displacement,
 * so the box looks empty and fills as it opens rather than sliding a finished
 * block into view.
 *
 * ---- the rest of the choreography ----
 *
 *  · A 2px underline draws left-to-right under the figure on `--motion-quick`.
 *    It is the receipt for the tap and the only thing that happens first.
 *  · Rows enter opacity 0 → 1, translateY 6px → 0, on `--motion-standard` /
 *    `--ease-enter`, stride `--motion-stagger`, never more than four steps —
 *    past four a list stops feeling responsive and starts feeling slow.
 *  · Out finishes before in starts: the rows are delayed past the underline,
 *    and on close they fade with no stagger, because leaving is not
 *    choreographed.
 *  · Exit is one step down: the panel opens on `--motion-deliberate` and
 *    collapses on `--motion-standard`.
 *  · Nothing queues. A tap mid-flight cancels what is running and plays the
 *    other direction from wherever it is.
 *
 * Reduced motion needs no branch here: every duration token clamps to 1ms, so
 * the panel simply appears and the rows simply are there.
 */
export interface TapeProps {
  /**
   * The evidence. Already checked with `openableTape` — pass null and the
   * figure renders as plain text that does not open, which is what a figure
   * whose working does not add up has to do.
   */
  block: TapeBlock | null;
  /** The figure itself. Rendered inside the trigger, and never moved by it. */
  children: ReactNode;
  /**
   * Optional content to the left of the figure on the same line — a week's
   * date range, say. It is a sibling of the trigger, never inside it: the row
   * means navigate and the figure means evidence, and one target may not mean
   * both.
   */
  before?: ReactNode;
  /** Names the figure for a screen reader on the control that opens it. */
  label: string;
  /** Aligns the header line when `before` is present. */
  align?: "baseline" | "center";
  /**
   * The ink the evidence is set in. Defaults to the page's text tokens; the
   * hero's End-of-month state overrides it because that card is painted with a
   * gradient, and the page's text colour is chosen for the page's background,
   * not for that one. Callers pass tokens — never a literal colour.
   */
  ink?: TapeInk;
}

export interface TapeInk {
  /** The restated figure on the closing line. */
  strong: string;
  /** Every evidence line. */
  line: string;
  /** The closing line's label, and the rule above it. */
  quiet: string;
  rule: string;
  /** The underline that draws under the figure on tap. */
  underline: string;
}

const DEFAULT_INK: TapeInk = {
  strong: "var(--text-primary)",
  line: "var(--text-secondary)",
  quiet: "var(--text-tertiary)",
  rule: "var(--hairline-2)",
  underline: "var(--lime-ink)",
};

export function Tape({ block, children, before, label, align = "baseline", ink = DEFAULT_INK }: TapeProps) {
  const [open, setOpen] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  /** FIRST: where the content below sat before React was told. */
  const firstTop = useRef<number | null>(null);
  /** Set once on open so the collapse can reproduce the same displacement. */
  const gap = useRef(0);
  const running = useRef<Animation[]>([]);
  const panelId = useId();

  const stop = useCallback(() => {
    running.current.forEach((animation) => {
      try {
        animation.cancel();
      } catch {
        /* already gone */
      }
    });
    running.current = [];
  }, []);

  const measureBelow = useCallback(() => {
    const el = host.current;
    if (!el) return null;
    const [below] = elementsBelow(el);
    return below ? below.getBoundingClientRect().top : null;
  }, []);

  const toggle = useCallback(() => {
    if (!block) return;
    // The one layout read of an open, taken here rather than in an effect so
    // it is genuinely BEFORE the DOM changes.
    firstTop.current = measureBelow();
    setOpen((was) => !was);
  }, [block, measureBelow]);

  useLayoutEffect(() => {
    const el = host.current;
    const box = panel.current;
    if (!el) return;

    const deliberate = motionToken("--motion-deliberate");
    const standard = motionToken("--motion-standard");
    const quick = motionToken("--motion-quick");
    const stride = motionToken("--motion-stagger");
    const easeStandard = easingToken("--ease-standard", "ease");
    const easeEnter = easingToken("--ease-enter", "ease-out");

    if (open) {
      if (!box) return;
      stop();
      // LAST. Same synchronous burst, before any frame is painted.
      const lastTop = measureBelow();
      const height = box.offsetHeight;
      const distance =
        firstTop.current !== null && lastTop !== null ? lastTop - firstTop.current : height;
      gap.current = Math.max(0, distance - height);

      const below = elementsBelow(el);
      running.current.push(...playInverseTranslate(below, distance, deliberate, easeStandard));
      const inner = box.firstElementChild;
      if (inner) {
        running.current.push(...playInverseTranslate([inner], distance, deliberate, easeStandard));
      }

      const rows = [...box.querySelectorAll<HTMLElement>("[data-motion-tape-row]")];
      rows.forEach((row, i) => {
        running.current.push(
          row.animate(
            [
              { opacity: 0, transform: "translateY(6px)" },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: standard,
              easing: easeEnter,
              // Past the underline, so the receipt for the tap is the first
              // thing that happens and the rows are not racing it.
              delay: quick + Math.min(i, 3) * stride,
              fill: "backwards",
            }
          )
        );
      });
      return;
    }

    /*
      Closed: either the first render, or a collapse that has just finished.

      The cancel belongs HERE and not in the animation's own callback. A
      collapse holds its end state with `fill: forwards`; cancelling it before
      React has removed the panel leaves one paintable frame where the panel is
      still in the flow and the content below has snapped back down over it.
      A layout effect runs after the DOM change and before the paint, so the
      two happen in the same frame and never disagree.
    */
    stop();
    firstTop.current = null;
  }, [open, stop, measureBelow]);

  /**
   * The collapse has to happen while the panel is still in the flow, so the
   * close is: play the collapse, then unmount. `closing` keeps the panel
   * mounted for exactly that long.
   */
  const [closing, setClosing] = useState(false);
  const beginClose = useCallback(() => {
    const el = host.current;
    const box = panel.current;
    if (!el || !box) {
      setOpen(false);
      return;
    }
    stop();
    const standard = motionToken("--motion-standard");
    const quick = motionToken("--motion-quick");
    const easeStandard = easingToken("--ease-standard", "ease");
    const distance = box.offsetHeight + gap.current;

    setClosing(true);
    const below = elementsBelow(el);
    running.current.push(...playCollapseTranslate(below, distance, standard, easeStandard));
    const inner = box.firstElementChild;
    if (inner) {
      running.current.push(...playCollapseTranslate([inner], distance, standard, easeStandard));
    }
    // Leaving is not choreographed: no stride, one step down from the enter.
    box.querySelectorAll<HTMLElement>("[data-motion-tape-row]").forEach((row) => {
      running.current.push(
        row.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: quick,
          easing: easeStandard,
          fill: "forwards",
        })
      );
    });

    const last = running.current[0];
    const finish = () => {
      setClosing(false);
      setOpen(false);
    };
    if (last) last.finished.then(finish, finish);
    else finish();
  }, [stop]);

  const onTrigger = useCallback(() => {
    if (open && !closing) beginClose();
    else if (!open) toggle();
  }, [open, closing, beginClose, toggle]);

  const showPanel = block !== null && (open || closing);

  return (
    <div
      ref={host}
      data-motion-tape
      data-motion-tape-state={closing ? "closing" : open ? "open" : "closed"}
      style={{ display: "block" }}
    >
      <div
        style={
          before === undefined
            ? { display: "block" }
            : { display: "flex", alignItems: align, justifyContent: "space-between", gap: 12 }
        }
      >
        {before}
        {block === null ? (
          <span style={{ display: "block" }}>{children}</span>
        ) : (
          <button
            type="button"
            data-motion-tape-trigger
            onClick={onTrigger}
            aria-expanded={open}
            // Only while the panel is actually in the document: a control that
            // points at an id nothing has is a broken relationship, not a
            // hidden one.
            aria-controls={open || closing ? panelId : undefined}
            aria-label={label}
            style={{
              // Hugs the figure rather than the column, so the underline is
              // the width of the number and not the width of the card.
              display: "inline-block",
              maxWidth: "100%",
              border: "none",
              background: "none",
              color: "inherit",
              font: "inherit",
              textAlign: "left",
              cursor: "pointer",
              // On a row, the padding is a tap target and the equal negative
              // margin gives it back to the layout, so the row is the height
              // it always was and the baselines still line up. In a column
              // (the hero) a negative margin would eat the card's gap, and the
              // figure there is 44px tall and needs no help.
              ...(before === undefined ? { padding: 0, margin: 0 } : { padding: "10px 0", margin: "-10px 0" }),
            }}
          >
            {/*
              A tight box around the glyphs, so the underline sits under the
              figure rather than under the tap target.
            */}
            <span style={{ display: "block", position: "relative" }}>
              {children}
              {/*
                The receipt for the tap. It draws from the left on
                --motion-quick and it is the only thing that happens in that
                first beat. It is also the only mark the Tape makes on the
                figure itself — the figure's ink, size and position are
                untouched.
              */}
              <span
                aria-hidden
                data-motion-tape-underline
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -2,
                  height: 2,
                  borderRadius: "var(--radius-pill)",
                  background: ink.underline,
                  transform: open ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "left",
                  transition: "transform var(--motion-quick) var(--ease-standard)",
                }}
              />
            </span>
          </button>
        )}
      </div>

      {showPanel && block && (
        <div
          ref={panel}
          id={panelId}
          data-motion-tape-panel
          style={{ overflow: "hidden" }}
        >
          <div>
            <TapeRows block={block} ink={ink} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The evidence itself. Every line is signed and the closing line restates the
 * figure that was opened, so the reader can add it up rather than believe it.
 */
function TapeRows({ block, ink }: { block: TapeBlock; ink: TapeInk }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", paddingTop: 10 }}>
      {block.lines.map((line, i) => (
        <div
          key={`${line.label}-${i}`}
          data-motion-tape-row
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            padding: "5px 0",
          }}
        >
          <span
            style={{
              fontSize: "var(--type-caption)",
              color: ink.line,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {line.label}
          </span>
          <span
            style={{
              fontSize: "var(--type-caption)",
              fontVariantNumeric: "tabular-nums",
              color: ink.line,
              flexShrink: 0,
            }}
          >
            {formatMoney(line.amount)}
          </span>
        </div>
      ))}
      <div
        data-motion-tape-row
        data-motion-tape-total
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          padding: "7px 0 2px",
          marginTop: 3,
          borderTop: `1px solid ${ink.rule}`,
        }}
      >
        <span style={{ fontSize: "var(--type-caption)", color: ink.quiet }}>{block.totalLabel}</span>
        <span
          style={{
            fontSize: "var(--type-caption)",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: ink.strong,
            flexShrink: 0,
          }}
        >
          {formatMoney(block.total)}
        </span>
      </div>
    </div>
  );
}
