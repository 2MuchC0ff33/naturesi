# Copilot Instructions — Nature's Infusions (Static Site)

## Overview
This repository is a static e-commerce-style site for Nature's Infusions, a marketplace for premium organic teas and herbal remedies. The site is designed as a Progressive Web App (PWA) with offline capabilities and is built using HTML, CSS, and JavaScript. The product catalog is data-driven from `products.json`.

### Key Components
- **HTML Pages**: Located in the root and `pages/` directory, these include `index.html`, `404.xhtml`, `offline.xhtml`, and other content pages.
- **CSS**: Styling is managed in `assets/css/main.css`.
- **JavaScript**: Client-side logic is in `assets/js/app.js`.
- **Service Worker**: `service-worker.js` handles PWA functionality.
- **Product Data**: `products.json` contains the product catalog.
- **Images**: Stored in `assets/img/`.

## Architecture
- **Static Site**: No server-side code; all functionality is client-side.
- **PWA**: Includes a service worker for offline support and a manifest file for PWA configuration.
- **Data Flow**: Product data is fetched from `products.json` and rendered dynamically on the store page.

## Development Workflows
### Local Preview
Run a local static server to preview the site:
```powershell
# Using Python 3
python -m http.server 8000; Start-Process "http://localhost:8000"

# Using Node.js (http-server)
npx http-server -p 8000 -c-1; Start-Process "http://localhost:8000"
```

### JSON Validation
Validate `products.json` to ensure it is well-formed:
```powershell
Get-Content .\products.json -Raw | ConvertFrom-Json > $null; if ($?) { "products.json valid" }
```

### Debugging
- Use browser DevTools to monitor network requests for `products.json` and `service-worker.js`.
- Check console logs for service worker registration and cache-clearing messages.

## Project-Specific Conventions
- **Product IDs**: Keep `id` fields in `products.json` stable; they are used as keys in the UI.
- **XHTML Compliance**: Pages like `404.xhtml` and `offline.xhtml` must adhere to XHTML 1.0 Strict standards.
- **Service Worker**: The development service worker (`service-worker.js`) uses a network-only strategy and clears caches on activation.
- **CSP and Headers**: Update both `index.html` and `web.config` when modifying headers or Content Security Policy (CSP).

## Key Files and Directories
- `index.html`: Main entry point.
- `products.json`: Product catalog.
- `assets/css/main.css`: Stylesheet.
- `assets/js/app.js`: Client-side logic.
- `service-worker.js`: Service worker for PWA functionality.
- `web.config`: IIS configuration for deployment.

## Examples
### Product Entry in `products.json`
```json
{
  "id": "product-turmeric",
  "name": "Turmeric Tea",
  "images": ["turmeric1.webp", "turmeric2.webp"],
  "inStock": true,
  "ingredients": ["Turmeric", "Ginger", "Cinnamon"],
  "options": [
    { "type": "Pouch", "weight": "60 grams", "price": 14.00 }
  ]
}
```

### Service Worker Registration in `app.js`
```javascript
if ('serviceWorker' in navigator && (window.location.hostname === 'localhost' || window.location.protocol === 'https:')) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => console.log('Service Worker registered:', registration))
    .catch(error => console.log('Service Worker registration failed:', error));
}
```

## Missing Features
- No build scripts, CI/CD pipelines, or automated tests are configured.
- Consider adding a production-ready service worker (`service-worker.prod.js`) with caching strategies.

## Next Steps
- Add a README with deployment instructions and local preview commands.
- Validate and expand `products.json` with complete product data.
- Ensure XHTML compliance for all `.xhtml` files using tools like `xmllint`.

For any ambiguities, refer to the `pages/` directory or run the site locally to observe behavior.

