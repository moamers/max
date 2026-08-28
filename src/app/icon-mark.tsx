/**
 * The app icon's artwork, in one place so `icon` and `apple-icon` cannot drift.
 *
 * THIS IS A STAND-IN. The design handoff refers to a "logo mark" three times
 * (screens 01, 02 and the menu) and never draws one, so there is no logo to
 * use. Rather than a letter — which is what iOS falls back to, and what the
 * founder saw on his home screen — this draws the one visual idea the product
 * actually has: the bar. Track is the budget, fill is the spend, and it sits
 * a little under the line, which is where the app is trying to keep you.
 *
 * Replace this file when a real mark exists. Nothing else needs to change.
 *
 * Rendered by Satori (next/og), which supports a subset of CSS: flexbox only,
 * every element needs an explicit `display`, and there is no `border-radius`
 * on a percentage. Keep it to solid fills and plain boxes.
 */

/** Dark ground and brand lime, from globals.css. iOS composites a transparent icon onto black, so this is deliberately opaque. */
const GROUND = "#0e0f14";
const TRACK = "#22262e";
const FILL = "#c6ff3d";

export function IconMark({ size }: { size: number }) {
  // Proportions, not pixels, so the same artwork holds at 32px and 180px.
  const pad = size * 0.2;
  const barWidth = size - pad * 2;
  const barHeight = size * 0.16;
  const gap = size * 0.11;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: GROUND,
      }}
    >
      {/* Three bars, filled to different points — the week rows of the home screen. */}
      {[0.72, 0.45, 0.9].map((filled, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            width: barWidth,
            height: barHeight,
            marginTop: i === 0 ? 0 : gap,
            borderRadius: barHeight / 2,
            background: TRACK,
          }}
        >
          <div
            style={{
              display: "flex",
              width: barWidth * filled,
              height: "100%",
              borderRadius: barHeight / 2,
              background: FILL,
            }}
          />
        </div>
      ))}
    </div>
  );
}
