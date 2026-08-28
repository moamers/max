import { ImageResponse } from "next/og";
import { IconMark } from "./icon-mark";

/**
 * The home-screen icon on iOS.
 *
 * Without this, "Add to Home Screen" falls back to the first letter of the
 * page title on a plain tile — which is the bare "M" the founder got. iOS reads
 * `apple-touch-icon` and does not fall back to the web manifest for it, so this
 * file is the fix; the manifest covers Android separately.
 *
 * 180×180 is the size iOS asks for. The artwork is full-bleed and opaque: iOS
 * applies its own rounded mask, and composites any transparency onto black.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<IconMark size={size.width} />, { ...size });
}
