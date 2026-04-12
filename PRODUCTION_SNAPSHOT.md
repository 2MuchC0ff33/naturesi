# Production Snapshot Report

**Generated:** March 30, 2026  
**Server:** `ftp.naturesinfusions.com.au`  
**Last Server Sync:** March 29, 2026 09:27 GMT  
**Main:** `b152bf0` — Feature/enhance UI ux (#39)  
**Development:** `f47a5fe` — 16 commits ahead of main

---

## Executive Summary

The production server is a **hybrid state** from multiple partial deployments over time. A full deployment from `development` is recommended to establish a clean, traceable baseline.

| Status                           | Count    |
| -------------------------------- | -------- |
| All identical across all         | ~287     |
| Server = Main (old state)        | 13       |
| Server = Development (new state) | 6        |
| **Differs from both**            | **49**   |
| **Total files analyzed**         | **~355** |

---

## File Coverage Summary

| Category          |  Total   | Identical | Server=Main | Server=Dev | Differs |
| ----------------- | :------: | :-------: | :---------: | :--------: | :-----: |
| CSS partials      |   122    |    118    |      4      |     0      |    0    |
| Icons             |    4     |     4     |      0      |     0      |    0    |
| Images            |    62    |    48     |      0      |     0      |   14    |
| Videos            |    2     |     2     |      0      |     0      |    0    |
| JS modules        |    27    |    24     |      0      |     3      |    0    |
| JS data           |    8     |     4     |      2      |     2      |    0    |
| JS shared/workers |    3     |     2     |      0      |     0      |    1    |
| Product partials  |    10    |     6     |      4      |     0      |    0    |
| Other partials    |    4     |     4     |      0      |     0      |    0    |
| HTML pages        |    27    |     3     |      0      |     0      |   24    |
| .well-known       |    20    |    18     |      0      |     0      |    2    |
| Root configs      |   ~25    |    ~19    |      2      |     1      |    3    |
| READMEs/docs      |    6     |     5     |      1      |     0      |    0    |
| Favicons/PWA      |   ~30    |    ~30    |      0      |     0      |    0    |
| .vscode           |    5     |     0     |      0      |     0      |    5    |
| **Total**         | **~355** | **~287**  |   **13**    |   **6**    | **49**  |

---

## Files That Differ From Both Branches (49 total)

These files have been manually modified on the server or deployed from mixed sources.

### HTML Pages (24)

| File                                | Notes                                 |
| ----------------------------------- | ------------------------------------- |
| `index.html`                        | Homepage - differs from both branches |
| `search.html`                       | Search page                           |
| `pages/about.html`                  | About page                            |
| `pages/cart.html`                   | Shopping cart                         |
| `pages/checkout.html`               | Checkout page                         |
| `pages/contact.html`                | Contact page                          |
| `pages/store.html`                  | Store index                           |
| `pages/terms.html`                  | Terms page                            |
| `pages/social.html`                 | Social links                          |
| `pages/stockists.html`              | Stockists page                        |
| `pages/shipping-estimate.html`      | Shipping calculator                   |
| `pages/payment/success.html`        | Payment success                       |
| `pages/payment/fail.html`           | Payment fail                          |
| `pages/store/black-tea.html`        | Black tea category                    |
| `pages/store/green-tea.html`        | Green tea category                    |
| `pages/store/herbal-infusions.html` | Herbal infusions                      |
| `pages/store/ice-tea.html`          | Ice tea category                      |
| `pages/store/wellness-blends.html`  | Wellness blends                       |
| `pages/store/artisan-blends.html`   | Artisan blends                        |
| `pages/store/balms.html`            | Balms category                        |
| `pages/store/creams.html`           | Creams category                       |
| `pages/store/accessories.html`      | Accessories category                  |
| `pages/store/selfcare.html`         | Self-care category                    |

### Images (14)

| File                                         | Notes               |
| -------------------------------------------- | ------------------- |
| `assets/img/hero-home-800x450.webp`          | Hero image          |
| `assets/img/hero-home-800x450.jpg`           | Hero image          |
| `assets/img/hero-home-800x450.svg`           | Hero image          |
| `assets/img/hero-home-1200x675.webp`         | Hero image          |
| `assets/img/hero-home-1200x675.jpg`          | Hero image          |
| `assets/img/hero-home-1200x675.svg`          | Hero image          |
| `assets/img/hero-home-1600x900.webp`         | Hero image          |
| `assets/img/hero-home-1600x900.jpg`          | Hero image          |
| `assets/img/hero-home-1600x900.svg`          | Hero image          |
| `assets/img/cart.webp`                       | Cart icon           |
| `assets/img/profile-placeholder-256x256.svg` | Profile placeholder |
| `assets/img/social-share-og.webp`            | OG share image      |
| `assets/img/social-share-twitter.webp`       | Twitter share image |

### JS Shared Worker (1)

| File                                            | Notes                       |
| ----------------------------------------------- | --------------------------- |
| `assets/js/shared/shared-cart.shared-worker.js` | Cart synchronization worker |

### .well-known (2)

| File                       | Notes                   |
| -------------------------- | ----------------------- |
| `.well-known/nodeinfo`     | NodeInfo protocol       |
| `.well-known/security.txt` | Security contact policy |

### Root Configs (3)

| File                | Notes                 |
| ------------------- | --------------------- |
| `package-lock.json` | NPM dependencies lock |
| `sitemap.xml`       | SEO sitemap           |
| `browserconfig.xml` | IE tile config        |

### .vscode Config (5)

| File                       | Notes                  |
| -------------------------- | ---------------------- |
| `.vscode/extensions.json`  | Recommended extensions |
| `.vscode/keybindings.json` | Keyboard shortcuts     |
| `.vscode/launch.json`      | Debug configs          |
| `.vscode/settings.json`    | Editor settings        |
| `.vscode/tasks.json`       | Build tasks            |

---

## Server = Main (13 files — old state)

These files on the server match the `main` branch but differ from `development`.

### Product Partials (4)

| File                                                 | Notes                      |
| ---------------------------------------------------- | -------------------------- |
| `assets/html/partials/products/balms.inc.html`       | Old version with SVG icons |
| `assets/html/partials/products/creams.inc.html`      | Old version                |
| `assets/html/partials/products/selfcare.inc.html`    | Old version with SVG icons |
| `assets/html/partials/products/accessories.inc.html` | Old version                |

### Product Data (2)

| File                           | Notes               |
| ------------------------------ | ------------------- |
| `assets/js/data/products.csv`  | Old product catalog |
| `assets/js/data/products.json` | Old product JSON    |

### CSS Partials (3)

| File                                          | Notes              |
| --------------------------------------------- | ------------------ |
| `assets/css/partials/components/products.css` | Old product styles |
| `assets/css/partials/elements/header.css`     | Old header styles  |
| `assets/css/partials/elements/forms.css`      | Old form styles    |

### Root Configs (2)

| File                | Notes                  |
| ------------------- | ---------------------- |
| `AGENTS.md`         | Old agent instructions |
| `service-worker.js` | Old service worker     |

### Documentation (1)

| File        | Notes       |
| ----------- | ----------- |
| `README.md` | Root README |

---

## Server = Development (6 files — new state)

These files on the server match the `development` branch.

### JS Data (2)

| File                             | Notes                |
| -------------------------------- | -------------------- |
| `assets/js/data/paypal.json`     | PayPal configuration |
| `assets/js/data/categories.json` | Category definitions |

### JS Modules (3)

| File                                  | Notes                  |
| ------------------------------------- | ---------------------- |
| `assets/js/app.js`                    | Main application       |
| `assets/js/modules/checkout.js`       | Checkout module        |
| `assets/js/modules/payment-status.js` | Payment status handler |

### Root Config (1)

| File            | Notes        |
| --------------- | ------------ |
| `manifest.json` | PWA manifest |

---

## All Identical (287+ files)

The following categories are identical across server, main, and development:

### CSS Partials (118 files)

All files in `assets/css/partials/` are identical:

- Components: accordions, alerts, badges, carousels, cart, categories, checkout, footer-overrides, hero, input-fields, loaders, modals, navigation, newsletter, notifications, popups, products, progress-bars, reviews, sliders, tabs, toasts, tooltips, transitions
- Elements: all, body, buttons, footer, forms, groups, header, headings, html, images, input, inputs, labels, links, lists, nav, paragraphs, tables, title, video
- Generic: base, normalize, reset, sanitize, selections, unstyle
- Objects: container, flexbox, grid, media-object, modals, responsive, wrapper
- Settings: breakpoints, colours, config, layout, media, settings, sizing, spacing, typography, variables
- Tools: accessibility, animations, browser-fixes, clearfix, hidden, interactions, mixins, performance, state, theme
- Templates: shadow-dom
- Utilities: animate, borders, center, cls, colors, compression, desktop, display, fcp, fie, filtering, flex, grid, grouping, hide, interactions, layering, lcp, margins, mobile, optimizations, overflow, paddings, pagination, positioning, responsive, shadows, shapes, show, sizing-helpers, smoothing, sorting, spacing-helpers, tablet, transforms, tti, typography-helpers, utilities, visibility, z-index

### Icons (4 files)

| File                              |
| --------------------------------- |
| `assets/img/icons/facebook.webp`  |
| `assets/img/icons/github.webp`    |
| `assets/img/icons/instagram.webp` |
| `assets/img/icons/search.webp`    |

### Product Images (35+ files)

All product images are identical across all three.

### Videos (2 files)

| File                           |
| ------------------------------ |
| `assets/video/production.webm` |
| `assets/video/production.mp4`  |

### JS Modules (24 files)

All modules except `app.js`, `checkout.js`, and `payment-status.js`.

### JS Data (4 files)

| File                                       |
| ------------------------------------------ |
| `assets/js/data/australian_postcodes.json` |
| `assets/js/data/cart-schema.json`          |
| `assets/js/data/postage.json`              |
| `assets/js/data/sample-cart.json`          |

### Product Partials (6 files)

| File                                                      |
| --------------------------------------------------------- |
| `assets/html/partials/products/artisan-blends.inc.html`   |
| `assets/html/partials/products/black-tea.inc.html`        |
| `assets/html/partials/products/green-tea.inc.html`        |
| `assets/html/partials/products/herbal-infusions.inc.html` |
| `assets/html/partials/products/ice-tea.inc.html`          |
| `assets/html/partials/products/wellness-blends.inc.html`  |

### Other Partials (4 files)

| File                           |
| ------------------------------ |
| `partials/footer-branding.txt` |
| `partials/footer-legal.txt`    |
| `partials/quick-links.txt`     |
| `partials/social-links.txt`    |

### .well-known (18 files)

All except `nodeinfo` and `security.txt`.

### Misc Configs (20+ files)

| File                 | Notes              |
| -------------------- | ------------------ |
| `404.html`           | Error page         |
| `offline.html`       | Offline page       |
| `.htaccess`          | Apache config      |
| `favicon.ico`        | Favicon            |
| `favicon.svg`        | SVG favicon        |
| `apple-icon*.png`    | Apple icons        |
| `android-icon*.png`  | Android icons      |
| `ms-icon*.png`       | Microsoft icons    |
| `CNAME`              | Custom domain      |
| `crossdomain.xml`    | Flash policy       |
| `humans.txt`         | Credits            |
| `opensearch.xml`     | Search provider    |
| `privacy.txt`        | Privacy policy     |
| `terms.txt`          | Terms of service   |
| `BingSiteAuth.xml`   | Bing verification  |
| `eslint.config.js`   | ESLint config      |
| `package.json`       | NPM package        |
| `CHANGELOG.md`       | Change log         |
| `CODE_OF_CONDUCT.md` | Code of conduct    |
| `CONTRIBUTING.md`    | Contributing guide |
| `LICENSE`            | License            |
| `SECURITY.md`        | Security policy    |

---

## Development Branch Commits Ahead of Main (16)

| #   | Hash      | Message                                                                   |
| --- | --------- | ------------------------------------------------------------------------- |
| 1   | `f47a5fe` | fix(products): update product grids with latest CSV data                  |
| 2   | `fdf9f0c` | feat(partials): regenerate product grids with updated descriptions        |
| 3   | `58a3e1c` | feat(products): update selfcare product descriptions with botanical names |
| 4   | `6b72eea` | fix(store): replace inline SVG social icons with WebP images              |
| 5   | `d31a563` | feat(homepage): add Winter Wellness testimonial                           |
| 6   | `634ba8e` | feat(balms): update Sleep Balm description                                |
| 7   | `5b2db42` | style(balms): add custom chevron arrow                                    |
| 8   | `f2a3c6a` | style(balms): align ingredients disclosure triangle                       |
| 9   | `b4c4eb3` | feat(balms): make ingredients section collapsible                         |
| 10  | `a3a6da6` | feat(balms): display 20ml size label                                      |
| 11  | `97943c6` | feat(balms): update descriptions                                          |
| 12  | `cf063b2` | fix(mobile): single-column product grid, search bar UX                    |
| 13  | `ad7bcc4` | feat(balms): update Calm and Sleep Balm ingredients                       |
| 14  | `dc1c8c4` | refactor(AGENTS): streamline for better agent readability                 |
| 15  | `1d007f7` | Squashed commit: checkout/PayPal/test enhancements                        |
| 16  | `69bfcc8` | squash: merge feature/checkout-paypal-merged                              |

---

## Recommendations

### Immediate Action

1. **Full deployment from `development` to production**
   - This will align production with the latest code
   - Run: `scripts/deploy-ftp.sh` from `development` branch

2. **Review the 49 differing files**
   - Check if any server-side customizations need to be preserved
   - Document any intentional server modifications

### Ongoing Process

1. **Use `scripts/check-production-diff.sh`** to monitor server differences
2. **Follow the workflow in `DEPLOYMENT.md`**
3. **Always deploy from `development` → `staging` → `main`**

---

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment workflow and process
- [scripts/check-production-diff.sh](../scripts/check-production-diff.sh) - Production diff checker
- [scripts/check-dev-sync.sh](../scripts/check-dev-sync.sh) - Development sync monitor
