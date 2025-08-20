Visual testing guidance — Nature's Infusions

This project is a static site. Automated visual regression tools are helpful but
for a small project manual snapshot checks are practical and reliable.

1) Purpose
   - Verify header layout, logo legibility, and search/cart affordances across
     key viewports and themes.

2) Quick manual workflow
   - Open `index.html` in a browser (file:// or via a simple static server).
   - Use the browser devtools to emulate the following viewports and capture
     screenshots of the header only (crop to the header area):
     - Mobile narrow: 360 × 800
     - Mobile wide / small tablet: 640 × 1024
     - Desktop small: 900 × 1200
     - Desktop wide: 1440 × 900
   - Also capture a dark-mode screenshot (toggle your OS or browser colour scheme
     to dark). Ensure the logo backdrop remains legible.

3) What to look for
   - All header elements (logo, search select, search input, search button, cart)
     are on a single row at each viewport where space allows.
   - The logo text within the SVG remains legible against its backdrop.
   - Focus outlines appear when tabbing through header controls.
   - Buttons and targets are not visually clipped and retain adequate spacing.

4) Optional automated approach
   - Use a visual regression tool such as Playwright's screenshot comparison,
     Percy, or Chromatic. Example Playwright steps (pseudo):
     - Launch a browser and navigate to the page.
     - Set viewport sizes (see above), take header screenshots, and compare to
       approved baselines.
     - If differences are intentional, update baselines.

5) Files added for tests
   - `tests/header-test.html` — a tiny browser-based smoke test that asserts the
     presence of key header elements and prints pass/fail results.

6) Notes
   - For CI, capture screenshots from a headless browser and compare via pixel
     diff (thresholds help ignore anti-aliasing noise).
   - If you want, I can add a Playwright test and a baseline screenshot set.
