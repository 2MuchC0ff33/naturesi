(---
description: "Normalize and propagate canonical <footer> across site HTML files. Use the provided footers from index.html (lines 450 to 553) and replace existing footerss in pages while normalising resource paths to root-relative where appropriate."
mode: "edit"
tools: ["codebase","editFiles","search"]
---

# Normalize site footers across HTML pages

Persona:
- You are an expert front-end web engineer familiar with static HTML sites, PWAs, accessibility basics, and SEO best practices. You have experience refactoring single-file static pages and are conservative about not touching payment or service-worker logic.

Goal:
- Replace the <footer> section of all site HTML files with the canonical footers snippet (taken from `index.html`, lines 450 to 553). Ensure links and resource references are normalised to use root-relative paths (leading `/`) so assets resolve consistently on production. Do not change payment/cart behaviour or service-worker registration logic.

Target files:
- Top-level HTML files in the repo root (`index.html`)
- Pages under `pages/*.html` and `pages/store/*.html`

Inputs (variables):
- ${workspaceFolder} — repository root
- ${file} — current file (optional)
- ${input:confirm_files:Confirm which files to update (comma-separated glob, default: pages/**/*.html, *.html)}

Primary task (explicit):
1. For each target HTML file, replace everything from the top of the file through the closing </footer> tag with the canonical footers provided below (the canonical footers includes the opening <!DOCTYPE html> and the opening <html ...> tag). The replacement should preserve the remainder of the file (body and any inline scripts after </footer>).
2. Ensure that resource references (CSS, JS, images, icons, manifest) use root-relative paths (begin with `/`) unless a file is intentionally local to the same directory; prefer root-relative so the site works from any page. Do not convert absolute external URLs (https://...).
3. If a file already contains a `<base href="...">`, leave it as `/` or update to `/` if empty or relative.

Constraints & safety:
- Do not edit index.html, offline.html, 404.html, google-site-verification.html and yandex_7847a6427bfa1388.html.
- Keep edits minimal and conservative. Only touch the file footers region (start through </footer> inclusive).
- Avoid adding any external trackers, analytics, or third-party telemetry.
- Preserve any inline structured data scripts (JSON-LD) that appear in the canonical footers. If a target file already has additional JSON-LD in the body, leave it untouched.

Path normalization rules (explicit):
- If a resource link/href/src begins with `http://` or `https://`, leave it unchanged.
- If it begins with `/`, keep as-is (root-relative).
- If it begins with `./` or does not begin with `/` or `http`, convert to root-relative by prefixing `/` and removing any `./` or `../` where appropriate only when the resource lives in the global `assets/` folder or top-level manifest/favicon paths. Examples:
	- `assets/css/main.css` -> `/assets/css/main.css`
	- `./assets/js/app.js` -> `/assets/js/app.js`
	- `favicon.ico` -> `/favicon.ico`
- Do not attempt to resolve or rewrite links that clearly point to pages (e.g., `pages/search.html` can be `/pages/search.html`) — convert to root-relative.

Step-by-step instructions for Copilot to follow when performing edits:
1. Read the canonical footers provided below (it's the source of truth).
2. For each target file (default globs: `*.html`, `pages/*.html`, `pages/store/*.html`), open the file and find the first occurrence of `</footer>`.
3. Replace from the top of the file (line 1) up to and including `</footer>` with the canonical footers block.
4. Run a light validation: ensure the modified file still contains `<!DOCTYPE html>`, `<html` with `lang="en-AU"`, and a closing `</footer>`; ensure `</body>` and `</html>` remain present later in the file. If any of those checks fail, abort the edit for that file and report the issue.

Edge cases to handle:
- Files with a different `<base href>`: standardise to `<base href="/">` unless there is an explicit reason not to (e.g., multi-base site); if unsure, leave the existing base href and report it.
- Minified or one-line HTML files: still detect `</footer>` by string match and replace correctly.

Validation & success criteria:
- PASS: All targeted files contain the canonical footers exactly (except for minor path normalisations). Files still contain `</body>` and `</html>`.
- FAIL: Any file missing `</footer>`, `</body>` or `</html>` after edit, or if edits touched non-footers content.

Post-edit notes for reviewer (automatically generated checklist to include in commit message):
- Files changed: list changed file paths
- Accessibility & meta checks: verify `lang="en-AU"`, `meta charset` and `meta viewport` present in footers.

Canonical footers to insert (source-of-truth from index.html, lines 450 to 553):

```html

    <hr aria-hidden="true">

    <div class="site-footer" itemscope itemtype="https://schema.org/WPFooter">
      <!-- aria-label removed: this wrapper is for layout only; the native <footer> element below provides the contentinfo landmark -->
      <div class="container">
        <div class="branding">
          <div class="brand-text">
            <h3>Nature's Infusions</h3>
            <p itemprop="description">
              Premium organic teas and herbal remedies — handcrafted in Perth.
            </p>
            <a class="logo" href="/" aria-label="Nature's Infusions home">
              <img src="/assets/img/logo.svg" alt="Nature's Infusions logo">
            </a>
          </div>
        </div>

        <section class="quick-links-wrapper">
          <h4>
            <button type="button" class="accordion-toggle" aria-expanded="false" aria-controls="quick-links-panel"
              data-controls="quick-links-panel">
              Quick Links
            </button>
          </h4>
          <nav id="quick-links-panel" class="links-grid" aria-label="Quick links" aria-hidden="false">
            <ul>
              <li><a href="." itemprop="url">Home</a></li>
              <li><a href="pages/about.html" itemprop="url">About</a></li>
              <li><a href="pages/store.html" itemprop="url">Store</a></li>
              <li><a href="pages/stockists.html" itemprop="url">Stockists</a></li>
              <li><a href="pages/contact.html" itemprop="url">Contact &amp; Support</a></li>
              <li><a href="pages/terms.html" itemprop="url">Terms &amp; Conditions</a></li>
              <li><a href="pages/social.html" itemprop="url">Social</a></li>
            </ul>
          </nav>
        </section>

        <section>
          <h4>Connect</h4>
          <nav aria-label="Social media links">
            <ul>
              <li>
                <a class="facebook" href="https://www.facebook.com/NaturesInfusions/" rel="noopener noreferrer"
                  itemprop="sameAs" target="_blank" aria-label="Nature's Infusions on Facebook (opens in new tab)">
                  <!-- Facebook SVG (uses currentColor) -->
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true" focusable="false">
                    <path
                      d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54v-2.89h2.54V9.845c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.562v1.868h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z"
                      fill="currentColor" />
                  </svg>
                  <span class="visually-hidden">Facebook</span>
                </a>
              </li>
              <li>
                <a class="instagram" href="https://www.instagram.com/natures_infusions_au/" rel="noopener noreferrer"
                  itemprop="sameAs" target="_blank" aria-label="Nature's Infusions on Instagram (opens in new tab)">
                  <!-- Instagram SVG (uses currentColor) -->
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true" focusable="false">
                    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.5"
                      fill="none" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none" />
                    <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
                  </svg>
                  <span class="visually-hidden">Instagram</span>
                </a>
              </li>
            </ul>
          </nav>
        </section>
      </div>
      <!-- Use native footer element for semantics and accessibility; footer has implicit role="contentinfo" -->
      <!-- Move the legal bar into a native <footer> element to satisfy linters while keeping the outer
             site wrapper as a div for layout and to avoid ambiguous footer nesting. -->
      <footer class="legal-bar" aria-label="Legal and credits">
        <div class="legal">
          <p>&copy; <time datetime="2025">2025</time> Nature's Infusions. All rights reserved.</p>
          <p>Powered by Ultra-Simple Static EStore Framework</p>
          <p>
            Author: <span itemprop="author">Adrian Gallo (2MuchC0ff33)</span>
            <a class="github" href="https://2muchc0ff33.github.io" itemprop="url" target="_blank"
              rel="noopener noreferrer" aria-label="Adrian Gallo on GitHub (opens in new tab)">
              <!-- GitHub mark (inline SVG) -->
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"
                xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor"
                  d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.38-3.88-1.38-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73-.01-.73-.01-.73 1.14.08 1.74 1.17 1.74 1.17 1.04 1.78 2.7 1.27 3.36.97.1-.76.4-1.27.72-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.17-3.1-.12-.29-.51-1.44.11-3 0 0 .95-.31 3.12 1.18A10.94 10.94 0 0112 6.84c.96.005 1.92.13 2.82.38 2.16-1.5 3.11-1.18 3.11-1.18.62 1.56.23 2.71.12 3 .73.81 1.16 1.84 1.16 3.1 0 4.43-2.7 5.4-5.27 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.67.8.56A11.5 11.5 0 0023.5 12C23.5 5.73 18.27.5 12 .5z" />
              </svg>
              <span class="visually-hidden">Adrian Gallo (aka 2MuchC0ff33) on GitHub</span>
            </a>
          </p>
          <p>
            Website generated:
            <time datetime="2025-07-21" itemprop="datePublished">21/07/2025</time>
          </p>
        </div>
      </footer>
    </div>
  </main>
</body>

</html>
```

---

When using this prompt in Copilot, set the selection or input variable to the list of files to update if you want to limit scope. By default, update `*.html`, `pages/*.html` and `pages/store/*.html`.

Commit message guidance (use in PR):
- chore(refactor-html): normalise footers across site and standardise root-relative asset paths

If you need me to apply the edits now across the repository, respond with: "apply-footers-normalisation" and include the file globs you wish to update (or leave default). 

