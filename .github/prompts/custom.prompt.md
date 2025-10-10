(---
description: "Normalize and propagate canonical <head> across site HTML files. Use the provided head from index.html (lines 1-188) and replace existing heads in pages while normalising resource paths to root-relative where appropriate."
mode: "edit"
tools: ["codebase","editFiles","search"]
---

# Normalize site head across HTML pages

Persona:
- You are an expert front-end web engineer familiar with static HTML sites, PWAs, accessibility basics, and SEO best practices. You have experience refactoring single-file static pages and are conservative about not touching payment or service-worker logic.

Goal:
- Replace the <head> section of all site HTML files with the canonical head snippet (taken from `index.html`, lines 1-188). Ensure links and resource references are normalised to use root-relative paths (leading `/`) so assets resolve consistently on production. Do not change payment/cart behaviour or service-worker registration logic.

Target files:
- Top-level HTML files in the repo root (`index.html`)
- Pages under `pages/*.html` and `pages/store/*.html`

Inputs (variables):
- ${workspaceFolder} — repository root
- ${file} — current file (optional)
- ${input:confirm_files:Confirm which files to update (comma-separated glob, default: pages/**/*.html, *.html)}

Primary task (explicit):
1. For each target HTML file, replace everything from the top of the file through the closing </head> tag with the canonical head provided below (the canonical head includes the opening <!DOCTYPE html> and the opening <html ...> tag). The replacement should preserve the remainder of the file (body and any inline scripts after </head>).
2. Ensure that resource references (CSS, JS, images, icons, manifest) use root-relative paths (begin with `/`) unless a file is intentionally local to the same directory; prefer root-relative so the site works from any page. Do not convert absolute external URLs (https://...).
3. If a file already contains a `<base href="...">`, leave it as `/` or update to `/` if empty or relative.

Constraints & safety:
- Do not edit offline.html, 404.html, google-site-verification.html and yandex_7847a6427bfa1388.html.
- Keep edits minimal and conservative. Only touch the file head region (start through </head> inclusive).
- Avoid adding any external trackers, analytics, or third-party telemetry.
- Preserve any inline structured data scripts (JSON-LD) that appear in the canonical head. If a target file already has additional JSON-LD in the body, leave it untouched.

Path normalization rules (explicit):
- If a resource link/href/src begins with `http://` or `https://`, leave it unchanged.
- If it begins with `/`, keep as-is (root-relative).
- If it begins with `./` or does not begin with `/` or `http`, convert to root-relative by prefixing `/` and removing any `./` or `../` where appropriate only when the resource lives in the global `assets/` folder or top-level manifest/favicon paths. Examples:
	- `assets/css/main.css` -> `/assets/css/main.css`
	- `./assets/js/app.js` -> `/assets/js/app.js`
	- `favicon.ico` -> `/favicon.ico`
- Do not attempt to resolve or rewrite links that clearly point to pages (e.g., `pages/search.html` can be `/pages/search.html`) — convert to root-relative.

Step-by-step instructions for Copilot to follow when performing edits:
1. Read the canonical head provided below (it's the source of truth).
2. For each target file (default globs: `*.html`, `pages/*.html`, `pages/store/*.html`), open the file and find the first occurrence of `</head>`.
3. Replace from the top of the file (line 1) up to and including `</head>` with the canonical head block.
4. Run a light validation: ensure the modified file still contains `<!DOCTYPE html>`, `<html` with `lang="en-AU"`, and a closing `</head>`; ensure `</body>` and `</html>` remain present later in the file. If any of those checks fail, abort the edit for that file and report the issue.

Edge cases to handle:
- Files with a different `<base href>`: standardise to `<base href="/">` unless there is an explicit reason not to (e.g., multi-base site); if unsure, leave the existing base href and report it.
- Minified or one-line HTML files: still detect `</head>` by string match and replace correctly.

Validation & success criteria:
- PASS: All targeted files contain the canonical head exactly (except for minor path normalisations). Files still contain `</body>` and `</html>`.
- FAIL: Any file missing `</head>`, `</body>` or `</html>` after edit, or if edits touched non-head content.

Post-edit notes for reviewer (automatically generated checklist to include in commit message):
- Files changed: list changed file paths
- Accessibility & meta checks: verify `lang="en-AU"`, `meta charset` and `meta viewport` present in head.

Canonical head to insert (source-of-truth from index.html, lines 1-188):

```html
<!DOCTYPE html>
<html class="no-js" lang="en-AU" dir="ltr" data-theme="light">

<head>
	<!-- Character Encoding and Rendering -->
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content=" IE=edge">
	<meta name="viewport" content=" width=device-width,initial-scale=1">
	<meta name="theme-color" content="#0f1111">
	<!-- Sets the theme color for mobile browsers (using your accent color) -->
	<meta name="color-scheme" content="light dark">

	<!-- Primary Meta Tags -->
	<title>Nature's Infusions | Premium Organic Teas &amp; Herbal Remedies</title>
	<meta name="description"
		content="Perth-based Naturopath's passion project offering certified organic teas and herbal infusions for holistic wellness. Australian-made since 2025.">
	<meta name="keywords"
		content="organic tea, herbal infusion, naturopath, Perth, wellness, detox, chamomile, peppermint, turmeric">
	<meta name="author" content="Nature's Infusions">
	<meta name="copyright" content="© 2025 Nature's Infusions">
	<meta name="generator" content="Ultra-Simple StaticEStore Framework">
	<base href="/">

	<!-- SEO and Indexing -->
	<meta name="robots" content="index,follow,max-image-preview:large">
	<meta name="referrer" content="strict-origin-when-cross-origin">
	<meta name="rating" content="general">
	<link rel="canonical" href="https://www.naturesinfusions.com.au/">
	<link rel="sitemap" href="/sitemap.xml" type="application/xml" title="Sitemap">

	<!-- Social Media Meta -->
	<!-- Open Graph -->
	<meta property="og:type" content="website">
	<meta property="og:url" content="https://www.naturesinfusions.com.au/">
	<meta property="og:title" content="Nature's Infusions | Premium Organic Teas and Herbal Infusions">
	<meta property="og:description" content="Australian-made organic teas and herbal infusions for holistic wellness">
	<meta property="og:image" content="https://www.naturesinfusions.com.au/assets/img/social-share-og.webp">
	<meta property="og:image:width" content="1200">
	<meta property="og:image:height" content="630">
	<meta property="og:locale" content="en_AU">
	<meta property="og:site_name" content="Nature's Infusions">

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:site" content="@naturesinfusions">
	<meta name="twitter:creator" content="@naturesinfusions">
	<meta name="twitter:title" content="Nature's Infusions | Premium Organic Teas and Herbal Infusions">
	<meta name="twitter:description" content="Australian-made organic teas and herbal infusions for holistic wellness">
	<meta name="twitter:image" content="https://www.naturesinfusions.com.au/assets/img/social-share-twitter.webp">

	<!-- PWA Configuration -->
	<meta name="theme-color" content="#4CAF50">
	<meta name="application-name" content="Nature's Infusions">
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-title" content="Nature's Infusions">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="format-detection" content="telephone=yes,email=yes,address=yes">
	<meta name="full-screen" content="yes">
	<meta name="browsermode" content="application">
	<meta name="screen-orientation" content="portrait-primary">

	<!-- Icons and Favicons -->
	<link rel="icon" href="/favicon.ico" type="image/x-icon">
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#4CAF50">
	<link rel="apple-touch-icon" href="/apple-touch-icon.png">
	<!-- Standard Sizes -->
	<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
	<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
	<link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96">
	<!-- Android -->
	<link rel="icon" href="/android-icon-192x192.png" type="image/png" sizes="192x192">
	<!-- Apple -->
	<link rel="apple-touch-icon" href="/apple-icon-57x57.png" sizes="57x57">
	<link rel="apple-touch-icon" href="/apple-icon-60x60.png" sizes="60x60">
	<link rel="apple-touch-icon" href="/apple-icon-72x72.png" sizes="72x72">
	<link rel="apple-touch-icon" href="/apple-icon-76x76.png" sizes="76x76">
	<link rel="apple-touch-icon" href="/apple-icon-114x114.png" sizes="114x114">
	<link rel="apple-touch-icon" href="/apple-icon-120x120.png" sizes="120x120">
	<link rel="apple-touch-icon" href="/apple-icon-144x144.png" sizes="144x144">
	<link rel="apple-touch-icon" href="/apple-icon-152x152.png" sizes="152x152">
	<link rel="apple-touch-icon" href="/apple-icon-180x180.png" sizes="180x180">
	<!-- Launch Images -->
	<link rel="apple-touch-startup-image" href="/launch-640x1136.png"
		media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)">

	<!-- Web App Manifest -->
	<link rel="manifest" href="/manifest.json" crossorigin="use-credentials">

	<!-- Resource Hints -->
	<link rel="dns-prefetch" href="//www.naturesinfusions.com.au">
	<link rel="preload" href="/assets/css/main.css" as="style">
	<link rel="prefetch" href="/assets/js/data/products.json" as="fetch">

	<!-- Cache Control -->
	<meta http-equiv="Cache-Control" content="public, no-cache, must-revalidate">
	<meta http-equiv="Pragma" content="no-cache">

	<!-- Security Headers -->
	<meta http-equiv="Content-Security-Policy"
		content="default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; script-src-elem 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://static.cloudflareinsights.com">
	<meta http-equiv="Permissions-Policy" content="geolocation=(),microphone=(),camera=()">
	<meta http-equiv="X-Content-Type-Options" content="nosniff">
	<meta http-equiv="Strict-Transport-Security" content=" max-age=63072000; includeSubDomains; preload">
	<meta http-equiv="Expect-CT" content=" max-age=86400, enforce">

	<!-- Verification -->
	<meta name="google-site-verification" content="[your-google-verification-code]">
	<meta name="msvalidate.01" content="B279BB1A64D31F7EC1A04AFAEFE05314">
	<meta name="yandex-verification" content="7847a6427bfa1388">

	<!-- Structured Data -->
	<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "Organization",
				"@id": "https://www.naturesinfusions.com.au/#organization",
				"name": "Nature's Infusions",
				"url": "https://www.naturesinfusions.com.au/",
				"logo": "https://www.naturesinfusions.com.au/assets/img/logo.svg",
				"description": "Perth-based naturopath's passion project offering certified organic teas and herbal infusions",
				"foundingDate": "2025",
				"sameAs": [
					"https://www.facebook.com/naturesinfusions.herbaltea/",
					"https://www.instagram.com/natures_infusions_au/",
					"https://au.linkedin.com/in/bree-gallo-75a81518a"
				],
				"contactPoint": [
					{
						"@type": "ContactPoint",
						"telephone": "+61 434 947 131",
						"contactType": "customer service",
						"email": "tea@naturesinfusions.com.au",
						"areaServed": "AU",
						"availableLanguage": "English"
					}
				],
				"address": {
					"@type": "PostalAddress",
					"streetAddress": "63 Meadowbrook Drive",
					"addressLocality": "Parkwood",
					"addressRegion": "WA",
					"postalCode": "6147",
					"addressCountry": "AU"
				}
			}
		</script>

	<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "WebSite",
				"@id": "https://www.naturesinfusions.com.au/#website",
				"url": "https://www.naturesinfusions.com.au/",
				"name": "Nature's Infusions",
				"publisher": { "@id": "https://www.naturesinfusions.com.au/#organization" },
				"potentialAction": {
					"@type": "SearchAction",
					"target": "https://www.naturesinfusions.com.au/pages/search.html?q={search_term_string}",
					"query-input": "required name="search_term_string""
				}
			}
		</script>

	<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "BreadcrumbList",
				"itemListElement": [
					{
						"@type": "ListItem",
						"position": 1,
						"name": "Home",
						"item": "https://www.naturesinfusions.com.au/"
					}
				]
			}
		</script>

	<link rel="stylesheet" href="/assets/css/main.css" type="text/css">
	<!-- OpenSearch description for browser search providers (matches /opensearch.xml) -->
	<link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="Nature's Infusions">

	<!-- Script Loading: load main JS as an ES module so app.js can import smaller modules (modular refactor) -->
	<!-- Cache-busting query added to force clients to fetch latest module during development/debugging -->
	<script type="module" src="/assets/js/app.js"></script>
</head>
```

---

When using this prompt in Copilot, set the selection or input variable to the list of files to update if you want to limit scope. By default, update `*.html`, `pages/*.html` and `pages/store/*.html`.

Commit message guidance (use in PR):
- chore(refactor-html): normalise head across site and standardise root-relative asset paths

If you need me to apply the edits now across the repository, respond with: "apply-head-normalisation" and include the file globs you wish to update (or leave default). 

