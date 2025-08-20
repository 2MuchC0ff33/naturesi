---
mode: 'agent'
model: 'GPT-4.1'
tools: ['codebase', 'problems', 'openSimpleBrowser', 'fetch', 'searchResults', 'githubRepo', 'editFiles', 'search', 'sequentialthinking', 'context7']
description: 'Refactor the repository HTML to follow modern HTML5 best practice, accessibility and consistency.'
---
Goal: Refactor the repository\'s HTML files so they adhere to modern HTML5 standards, improve semantics, accessibility, and maintain the repo conventions (single-file pages, no build step, privacy-first).

Context:
- This repo is an ultra-simple, static mobile-first EStore (plain HTML, CSS, vanilla JS).
- Preserve privacy-first and accessibility-first constraints (no analytics, no third-party trackers).
- Follow repo conventions described in .github/copilot-instructions.md (single-file pages, service-worker behaviour, payment flows).
- Use Australian English (en-AU) for any added copy, comments and commit messages.

Constraints & safety:
- Ensure consistency with existing code and styles.
- Ensure <head> includes all necessary meta tags, title, and links and is consistent.
- Make minimal, reversible edits. Avoid wide structural rewrites unless necessary.
- Do not introduce remote third-party scripts, analytics or cookies.
- Respect service-worker patterns and PWA/offline files.
- When changing payment/cart forms, flag for manual review in the commit message.
- Keep edits limited to files under repo root, pages/, assets/css/, assets/js/, .github/ and other config files.

Acceptance criteria (what "done" looks like):
- All updated HTML files:
    - Use <!DOCTYPE html> and <html lang="en-AU">.
    - Have valid, semantic structure (header, main, nav, footer, landmark roles where needed).
    - Replace deprecated tags/attributes and ensure correct use of ARIA where necessary.
    - Provide accessible form labels, keyboard focus order and meaningful alt text.
    - Preserve existing privacy and service-worker behaviour.
- Changes are small, well-commented and reversible.
- Commit message follows repo commit template (en-AU), and any payment/cart changes are explicitly flagged.

Recommended steps:
1. Inspect pages/*.html, index.html, offline.html, 404.html and manifest.json first.
2. For each HTML file:
     - Ensure the DOCTYPE and <html lang="en-AU"> are present.
     - Replace deprecated tags (e.g. <font>, presentational attributes) with CSS.
     - Use semantic elements: header, nav, main, article, section, aside, footer.
     - Ensure images have descriptive alt attributes or role="presentation" if decorative.
     - Ensure forms have <label> elements tied to inputs and include accessible error messaging placeholders.
     - Verify meta viewport and character encoding are present in <head>.
     - Run a local HTML validator or browser inspector as a quick sanity check.
3. For small JS/CSS tweaks, add files under assets/js/ or assets/css/ and reference with relative paths.
4. Add short comments in edited files describing the change and reasoning.
5. Prepare a concise commit using the provided template and include files affected and any manual review notes.

Examples of safe, small edits:
- Replace <div id="nav"> with <nav id="primary-nav" aria-label="Main navigation"> and ensure list-based links.
- Replace inline presentational attributes with classes and update assets/css/main.css.
- Add <meta name="viewport" content="width=device-width,initial-scale=1"> if missing.
- Ensure service-worker registration guards remain (only on https: or localhost).

Output:
- Edit files in-place. For each PR/commit produce:
    - Edited files with minimal, well-commented changes.
    - A commit message following the repo template (en-AU).
    - If payment/cart forms were touched, include a manual-review note in the commit body.

If anything is unclear, ask one short clarifying question and reference the specific file path inspected.

