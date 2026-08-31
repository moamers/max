import {
  APP_ICON_MARK_OFFSET,
  APP_ICON_MARK_SCALE,
  APP_ICON_RADIUS,
  APP_ICON_SIZE,
  COUNTERBALANCE_A,
  COUNTERBALANCE_B,
} from "@/components/brand/counterbalance-paths";

/**
 * The app icon: the Counterbalance mark on the theme's dark ground.
 *
 * Same three paths `Counterbalance.tsx` draws — imported, not copied, so the
 * mark on the phone's home screen cannot drift from the mark inside the app.
 *
 * The colours are literals because Satori (next/og) has no CSS variables. They
 * are the Ravel kit's quiet-voltage dark values, which is the artwork the kit
 * ships as `logos/svg/ravel-quiet-voltage-dark-app-icon.svg` (also copied to
 * `public/brand/logos/`). One icon has to serve every theme and mode — a route
 * cannot know which the viewer has chosen — so it uses the default theme on a
 * dark ground, which is what iOS composites transparency onto anyway.
 *
 * The mark is delivered as a data-URI `<img>` rather than inline SVG: Satori's
 * inline-SVG support is partial (it does not honour `clip-path`, which this
 * mark needs for its intersection), and an image is the path it renders
 * reliably.
 */
const GROUND = "#121426";
const FORM_A = "#8F7CFF";
const FORM_B = "#45E0B7";
const INTERSECTION = "#FF5C7C";

/** The kit's app-icon artwork, verbatim, as a data URI. */
export function appIconDataUri(): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${APP_ICON_SIZE} ${APP_ICON_SIZE}">` +
    `<rect width="${APP_ICON_SIZE}" height="${APP_ICON_SIZE}" rx="${APP_ICON_RADIUS}" fill="${GROUND}"/>` +
    `<g transform="translate(${APP_ICON_MARK_OFFSET} ${APP_ICON_MARK_OFFSET}) scale(${APP_ICON_MARK_SCALE})">` +
    `<defs><clipPath id="app-clip"><path d="${COUNTERBALANCE_A}"/></clipPath></defs>` +
    `<path fill="${FORM_A}" d="${COUNTERBALANCE_A}"/>` +
    `<path fill="${FORM_B}" d="${COUNTERBALANCE_B}"/>` +
    `<path fill="${INTERSECTION}" clip-path="url(#app-clip)" d="${COUNTERBALANCE_B}"/>` +
    `</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function IconMark({ size }: { size: number }) {
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
      <img src={appIconDataUri()} width={size} height={size} alt="" />
    </div>
  );
}
