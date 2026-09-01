import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Newsreader, Libre_Franklin } from "next/font/google";
import {
  APP_DESCRIPTION,
  APP_NAME,
  MODE_COOKIE,
  THEME_COOKIE,
  modeAttribute,
  parseMode,
  parseTheme,
} from "@/lib/brand";
import "./globals.css";

/**
 * Bookish, per docs/design/direction/00-SETTLED.md: Newsreader for the one
 * large figure on a screen, Libre Franklin for everything else, and no
 * monospace anywhere — tabular-nums does the aligning a terminal face used to.
 */
const franklin = Libre_Franklin({
  variable: "--font-franklin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  // Added when "Add to Home Screen" produced a bare letter tile. The icon
  // itself comes from `icon.tsx` / `apple-icon.tsx`, which Next links
  // automatically; this is the name under it and how it launches.
  appleWebApp: {
    title: APP_NAME,
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

/**
 * The theme and mode are stamped onto <html> here, on the server, from the
 * preference cookies.
 *
 * This is the whole anti-flash mechanism. The first bytes of HTML already carry
 * `data-theme` (and `data-mode` when the choice is explicit), so the browser's
 * first paint is already correct. Reading a preference in a `useEffect` paints
 * once and then repaints; even a blocking inline script is code the browser has
 * to run before it can paint. Neither is needed when the server can just say so.
 *
 * `data-mode` is deliberately omitted for the "system" choice — the third
 * state. `brand-tokens.css` then resolves light or dark from
 * `prefers-color-scheme` in CSS alone, which means the OS is honoured with no
 * JavaScript at all, and an explicit choice still wins over it.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);
  const mode = modeAttribute(parseMode(jar.get(MODE_COOKIE)?.value));

  return (
    <html
      lang="en"
      data-theme={theme}
      {...(mode ? { "data-mode": mode } : {})}
      className={`${franklin.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
