import { ImageResponse } from "next/og";
import { IconMark } from "./icon-mark";

/** The browser tab and Android launcher icon. Same artwork as `apple-icon`. */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<IconMark size={size.width} />, { ...size });
}
