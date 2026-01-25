Icon guidance — Nature's Infusions

This file documents recommended PWA icon assets so contributors can generate proper app icons.

Recommendations:
- Provide PNG or WebP icons sized at: 192x192 (maskable), 512x512 (maskable), 180x180 (apple-touch), 48/72/96 (as needed).
- For maskable icons, use the "maskable" purpose so launchers can adapt shapes; include both "maskable" and "any" where appropriate (e.g., "purpose": "maskable any").
- Vector sources (SVG) are preferred for scalable icons; include a raster export for 512x512 for devices that prefer a raster asset.

How to generate:
1. Start from your master SVG (logo.svg).
2. Export PNG at 512x512 and 192x192 with a solid background or with appropriate safe padding for maskable shape.
3. Add the files to the repo under `/assets/img/` and update `manifest.json` accordingly.

Notes:
- If you need assistance generating optimised images (WebP/PNG) or an automated script to generate multiple sizes, I can add a small node script to the repo.
