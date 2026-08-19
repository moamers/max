export const THEME_STORAGE_KEY = "max-theme";

/**
 * The literal script body inlined into <head> so the stored theme choice
 * (if any) is applied before first paint — otherwise a dark-mode user with
 * "light" saved would see a flash of dark, and vice versa. Runs before
 * hydration; deliberately has no dependency on React or any module system.
 */
export function themeInitScript(): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;
}
