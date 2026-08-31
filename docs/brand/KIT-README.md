# Ravel brand kit

This package contains the Counterbalance logo across both Ravel colour themes and both interface modes.

## Themes

| Theme ID | Name | Character | Origin |
| --- | --- | --- | --- |
| `quiet-voltage` | Quiet Voltage | Calm, credible and data-forward with vivid signals | Original exported palette |
| `butter-static` | Butter Static | Warm, editorial and playfully electric | New butter/lilac/lime palette |

Each theme includes light and dark tokens in JSON and CSS. Give `themes/CLAUDE-THEME-BRIEF.md` to Claude together with `themes/ravel-themes.json`.

## Logo exports

- SVG: scalable masters for symbol, editable and outlined Ravel lockups, and app icon
- PDF and EPS: print/vector exports
- PNG: transparent symbols at 16, 24, 32, 48, 64, 128, 180, 192, 256, 512, 1024 px
- PNG app icons: 16, 32, 48, 64, 128, 180, 192, 256, 512, 1024 px
- PNG lockups: 320, 640, 1280 px wide
- WebP: 512 px symbols/icons and 1280 px lockups
- Web: ICO, favicon PNGs, Apple touch icon, Android icons and manifest
- Monochrome: dark and light symbol masters and raster sizes

## Naming pattern

`ravel-[theme]-[mode]-[asset]-[size].[format]`

Examples: `ravel-butter-static-dark-app-icon-512.png` and `ravel-quiet-voltage-light-lockup.svg`.

## Usage

- Use the full lockup when the name must be introduced.
- Use the symbol alone for app icons, avatars and established navigation.
- Keep the mark's geometry unchanged; only the mapped theme colours change.
- Preserve clear space equal to roughly one quarter of the symbol width.
- Use monochrome artwork when colour reproduction is unavailable.

The editable lockup uses URW Gothic; use the `-lockup-outlined.svg` version when font portability matters. Keep the editable version if the wordmark may still change before final trademark production.
