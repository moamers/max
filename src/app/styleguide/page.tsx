import { cookies } from "next/headers";
import { MODE_COOKIE, THEME_COOKIE, parseMode, parseTheme } from "@/lib/brand";
import { StyleguideView } from "./StyleguideView";

/**
 * Server shell for the styleguide. It exists only to read the brand preference
 * cookies — the switch has to render already-selected, from the server, for the
 * same reason the rest of the app does (see ThemeControls).
 */
export const dynamic = "force-dynamic";

export default async function StyleguidePage() {
  const jar = await cookies();
  return (
    <StyleguideView
      brand={{
        theme: parseTheme(jar.get(THEME_COOKIE)?.value),
        mode: parseMode(jar.get(MODE_COOKIE)?.value),
      }}
    />
  );
}
