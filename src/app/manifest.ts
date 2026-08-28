import type { MetadataRoute } from "next";

/**
 * Android's equivalent of the apple-touch-icon, plus the name shown under the
 * icon on both platforms. iOS reads `apple-icon` for the home screen rather
 * than this, so the two are needed together, not instead of each other.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Max",
    short_name: "Max",
    description:
      "A personal wealth agent that reads your budget and tells you where you stand.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0f14",
    theme_color: "#0e0f14",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
