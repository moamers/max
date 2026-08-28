import {
  MAX_MARK_BODY,
  MAX_MARK_LEAF,
  MAX_MARK_VIEWBOX,
} from "@/components/home/max-mark-paths";

/**
 * The app icon: the Max mark on a dark ground.
 *
 * Same two paths the month bar and the menu draw — imported, not copied, so
 * the mark on the phone's home screen cannot drift from the mark inside the
 * app. The colours are literals because Satori (next/og) has no CSS variables;
 * they are the dark theme's `--text-primary` and the brand `--lime-fill`,
 * which is the same in both themes.
 *
 * The mark is delivered as a data-URI `<img>` rather than inline SVG: Satori's
 * inline-SVG support is partial, and an image is the path it renders reliably.
 */
const GROUND = "#0e0f14";
const BODY = "#f2f4ee";
const LEAF = "#c6ff3d";

function markDataUri(): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MAX_MARK_VIEWBOX}">` +
    `<path d="${MAX_MARK_BODY}" fill="${BODY}"/>` +
    `<path d="${MAX_MARK_LEAF}" fill="${LEAF}"/>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function IconMark({ size }: { size: number }) {
  // The mark's own artwork sits high in its 100×100 box (the leaf starts at
  // y=3, the body ends at y=95), so it is centred as drawn rather than nudged.
  const inner = Math.round(size * 0.62);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: GROUND,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={markDataUri()} width={inner} height={inner} alt="" />
    </div>
  );
}
