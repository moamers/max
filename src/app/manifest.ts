import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";

/**
 * Android's equivalent of the apple-touch-icon, plus the name shown under the
 * icon on both platforms. iOS reads `apple-icon` for the home screen rather
 * than this, so the two are needed together, not instead of each other.
 *
 * The colours are the Ravel kit's quiet-voltage dark canvas and primary — the
 * same ground the generated app icon is drawn on, so the splash screen and the
 * icon agree. A manifest cannot follow the user's theme choice; it names one.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#121426",
    theme_color: "#8f7cff",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
