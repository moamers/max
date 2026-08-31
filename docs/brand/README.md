# Ravel brand kit — provenance

The files beside this one are the source the app's palette is derived from, kept
in the repo so a reviewer can check the mapping against the original rather than
against a description of it.

| File | What it is |
| --- | --- |
| `ravel-themes.css` | The kit's eight tokens per theme/mode, verbatim |
| `ravel-themes.json` | The same values as data |
| `KIT-README.md` | The kit's own README (naming pattern, usage rules) |

**Where they are used**

- `src/app/brand-tokens.css` is the mapping layer: it restates the kit's tokens
  and derives every other token this app's components read. It is the only place
  a colour is decided.
- `src/lib/__tests__/brand-token-contrast.test.ts` parses that file, resolves the
  `color-mix()` chains the way a browser does, and fails if any pairing drops
  below its WCAG floor.
- `public/brand/logos/` holds the SVG masters; `public/brand/web/` holds the
  kit's favicon/Apple/Android raster set.
- `src/components/brand/counterbalance-paths.ts` holds the mark's geometry,
  copied from `logos/svg/ravel-*-symbol.svg`. The app and the generated app icon
  both draw from it, so they cannot become two different shapes.

The kit ships PNG and WebP rasters at eleven sizes plus PDF/EPS. Only the SVG
masters and the `web/` set were copied in; the rest are print and export
artefacts with no runtime consumer.
