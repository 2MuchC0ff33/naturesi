## CSS Comment Syntax Policy

All CSS files in this repository must use standard CSS block comments only:

  /* This is a valid CSS comment */

Do **not** use JavaScript-style `//` comments in any CSS file. This ensures compatibility with all CSS parsers, minifiers, and tools.

- Use `/* ... */` for all comments, including inline and documentation comments.
- Remove or convert any `//` comments found in CSS files.

This rule is mandatory for all contributors and Copilot-generated code. PRs or code suggestions with `//` comments in CSS will not be accepted.
# Copilot instructions — Nature's Infusions (static E‑Store)

## Auto-Context: Agents & Instructions (MANDATORY)

Copilot MUST always use the following agents and instruction files for every relevant task, PR, refactor, and documentation change. These files are auto-included and referenced by default—users do NOT need to manually add them as context.

### Agents (always active)

- [.github/agents/accessibility.agent.md](.github/agents/accessibility.agent.md): Web accessibility, WCAG, a11y testing, inclusive UX
- [.github/agents/janitor.agent.md](.github/agents/janitor.agent.md): Codebase cleanup, simplification, tech debt removal
- [.github/agents/modernization.agent.md](.github/agents/modernization.agent.md): Modernization analysis, planning, and implementation
- [.github/agents/Ultimate-Transparent-Thinking-Beast-Mode.agent.md](.github/agents/Ultimate-Transparent-Thinking-Beast-Mode.agent.md): Maximum transparency, creative overclocking, relentless completion

### Instruction Files (always referenced)

- [.github/instructions/html-css-style-color-guide.instructions.md](.github/instructions/html-css-style-color-guide.instructions.md): Accessible, professional HTML/CSS color and style rules
- [.github/instructions/markdown.instructions.md](.github/instructions/markdown.instructions.md): Markdown content, formatting, and structure standards
- [.github/instructions/nodejs-javascript.instructions.md](.github/instructions/nodejs-javascript.instructions.md): Node.js/JavaScript coding and testing guidelines
- [.github/instructions/performance-optimization.instructions.md](.github/instructions/performance-optimization.instructions.md): Performance best practices for all stacks
- [.github/instructions/security-and-owasp.instructions.md](.github/instructions/security-and-owasp.instructions.md): Secure coding, OWASP Top 10, industry security standards
- [.github/instructions/self-explanatory-code-commenting.instructions.md](.github/instructions/self-explanatory-code-commenting.instructions.md): Commenting for self-explanatory code

### Prompts (auto-included)

- [.github/prompts/boost-prompt.prompt.md](.github/prompts/boost-prompt.prompt.md): Enhanced prompt for Copilot agents
- [.github/prompts/documentation-writer.prompt.md](.github/prompts/documentation-writer.prompt.md): Diátaxis documentation expert workflow
- [.github/prompts/readme-blueprint-generator.prompt.md](.github/prompts/readme-blueprint-generator.prompt.md): README generator and structure
- [.github/prompts/update-markdown-file-index.prompt.md](.github/prompts/update-markdown-file-index.prompt.md): Markdown file index updater

**Copilot must always reference and apply these agents/instructions/prompts for every relevant task. Manual context management is NOT required.**

#### Example Workflow (Auto-Context)

- When refactoring HTML/CSS/JS, Copilot automatically applies accessibility, color/style, and security instructions.
- For documentation, Copilot uses markdown standards and Diátaxis documentation expert workflow.
- For code cleanup, Copilot invokes janitor agent and performance/security instructions.
- For modernization, Copilot leverages modernization agent and all relevant instructions.
- For commenting, Copilot applies self-explanatory code commenting instructions.

#### Contributor Reminder

- You do NOT need to manually add agents/instructions/prompts as context—Copilot will always use them.
- All PRs, refactors, and documentation changes are auto-validated against these files.
- If you add new agents/instructions/prompts, update this section to ensure auto-context coverage.

---

Purpose: give an AI coding agent the minimal, practical context to be productive in this single-page, static storefront.

Quick facts

- Static site only: plain HTML, CSS and vanilla JS. No Node build, no tests. Edit files directly under repo root, `pages/`, `assets/css/` and `assets/js/`.
- Product data: `products.json`, `product-categories.json` and `categories.json` are the primary machine-readable product files. A `.env` references CSV paths (e.g. `PRODUCTS_CSV_PATH`), and `PAYPAL_EMAIL` appears in `.env` for payments.

## TL;DR (quick scope for automated agents)

- Allowed: small HTML5 refactors, accessibility fixes, conservative CSS/JS changes under `assets/`, and documentation or metadata updates.
- Why: a short summary helps automated agents make safe, quick decisions and reduces ambiguous prompts.

Primary areas to inspect

- UI & styles: `assets/css/partials/*.css`.
- Behaviour & registration: `assets/js/app.js` (service-worker registration, dev helpers).
- Offline & PWA: `service-worker.js`, `manifest.json`, `offline.html`, `404.html`.
- Store logic: `pages/store/*.html` (product forms submit to `/add-to-cart`; changing forms or inputs can affect PayPal/cart flow).
- Hosting rules: `.htaccess` and `web.config` (URL rewrites, canonical index behaviour).

Project-specific conventions

- Single-file pages: pages are self-contained HTML files (e.g. `pages/about.html`) — prefer small, targeted edits rather than introducing a global templating system.
- Assets location: add new CSS under `assets/css/partials` and JS under `assets/js/modules` and reference them relatively (never add CDN trackers).
- Privacy-first: repository intentionally disables analytics and third-party tracking (`privacy.txt`, `.well-known/`). Do not add analytics or third-party cookies.
- Language/style: use Australian English (`en-AU`) for any UI text or docs and set `<html lang="en-AU">` on new/edited pages.

## Allowed edits (examples)

- Update semantic HTML (header/nav/main/footer) and add meta charset/viewport.
- Add or improve alt text on images and add `<label for="...">` bindings for form controls.
- Small, reversible CSS utility classes in `assets/css/partials/*.css` and non-invasive JS helpers in `assets/js/modules/*.js`.
- Non-functional documentation, README improvements, and `.github/*` repo config changes.

## PR / Commit checklist (copy into PR body)

- Title format: `chore(refactor-html): short summary`
- Files changed: list them (mandatory)
- Smoke test performed: `python -m http.server 8000` and service-worker install/uninstall tested on `localhost` (yes/no)
- HTML meta & semantics checked: yes/no
- Accessibility basics verified (labels, alt text, form associations): yes/no
- Tools used: list MCP servers/tools and key results/links (e.g. `mcp_github_github_search_code` – found SW registration in `assets/js/app.js`)
- Reviewer: [2MuchC0ff33@example.org] (replace with the actual contact before merge)

## HTML5 refactor checklist

Goal: Refactor the repo's HTML so files follow modern HTML5 semantics, improve accessibility, and remain privacy‑first while preserving the project's single‑file page convention and no‑build workflow.

Acceptance criteria

- All edited HTML use a top-line `<!DOCTYPE html>` and `<html lang="en-AU">`.
- Pages include meta charset and meta viewport (`<meta charset="utf-8">` and `<meta name="viewport" content="width=device-width,initial-scale=1">`).
- Semantic landmarks are used (header, nav, main, footer, article/section/aside where appropriate).
- Deprecated tags/attributes are removed (replace with classes + `assets/css/partials/*.css`).
- Images have meaningful `alt` text or are explicitly decorative (`role="presentation"`), and form controls have associated `<label>`s.
- ARIA is used only when semantic HTML cannot provide the required semantics.
- Changes are small, well-commented in-line, and reversible.

Recommended process (step-by-step)

1. Inspect these files first: `index.html`, `pages/*.html`, `pages/store/*.html`, `offline.html`, `404.html`, and `manifest.json`.
2. For each HTML file:
   - Ensure `<!DOCTYPE html>` and `<html lang="en-AU">` are present.
   - Add or verify `<meta charset="utf-8">` and viewport meta.
   - Replace presentational markup with semantic elements and CSS classes; update `assets/css/main.css` conservatively.
   - Ensure forms have `<label for="...">` bound to inputs and include placeholders for accessible error messaging.
   - Ensure images use descriptive `alt` attributes or explicit decorative roles.
   - Add brief inline comments describing why the change was made (one line) and reference the acceptance checklist.
3. Keep edits scoped to repo root, `pages/`, `pages/store/`, `assets/css/partials/`, `assets/js/modules/`, `assets/js/data/`,`.github/` and similar config files.

Safe, small examples

- Replace `<div id="nav">` with `<nav id="primary-nav" aria-label="Main navigation">` and use a `<ul>` for links.
- Replace inline presentational attributes (e.g. `align`, `bgcolor`) with utility classes and update `assets/css/main.css`.
- Add `<meta name="viewport" content="width=device-width,initial-scale=1">` to any pages missing it.
- Ensure service-worker registration remains guarded (e.g. `if (location.protocol === 'https:' || location.hostname === 'localhost') { ... }`).

Commit guidance for refactors (en-AU)

- Format: chore(refactor-html): short summary
- Example: chore(refactor-html): modernise semantics in `pages/about.html` and `index.html`
- Commit body must list files changed, brief rationale, and include this line if payment/cart touched:

## Use of MCP servers & tools

When available and enabled, use the repository's MCP servers and their specialised tools to gather authoritative, up‑to‑date information and to perform repository operations. Always document which tools were used in the PR/commit body.

Guidance (when to use which tool)

- Microsoft docs tools (mcp*microsoft_doc*\*): use for Azure / Microsoft Learn documentation, samples and canonical API guidance. Prefer `microsoft_docs_search` to discover pages, `microsoft_code_sample_search` when you need concrete code examples, and `microsoft_docs_fetch` to retrieve full pages for step‑by‑step procedures.
- GitHub tools (mcp*github_github*\*): use for repository interactions (create/update files, create PRs, issues, branches). When creating or updating files programmatically, include a clear commit message and list all changed files. If using the `create_pull_request_with_copilot` option, populate the problem statement and title clearly and follow the manual‑review rules for payment/cart edits.
- Web search (mcp_github_github_bing_search): use when current web evidence is needed (recent standards, browser behaviour, or newly published guidance). Always cite the returned URLs in PR descriptions.
- Library docs (mcp*upstash_conte*\*): use `resolve-library-id` then `get-library-docs` to fetch authoritative library documentation before implementing or upgrading library-specific code.
- Parallel tooling: where applicable, run independent searches (e.g. docs + code search) in parallel to speed discovery; still summarise all sources in your PR.

Operational rules

- Record every automated tool usage in the PR body (tool names and key results or links). This helps reviewers verify sources and decisions.
- Respect privacy constraints: do not use tools to inject remote telemetry, third‑party analytics, or external beacons.
- Required policy: When available and enabled, GitHub Copilot MUST use Context7 (`mcp_upstash_conte`) for library documentation lookups and `mcp_sequentialthinking` for multi-step planning. Always confirm these servers are enabled before calling them, and record every automated tool usage (including which server/tool was used and a short justification) in the PR body.

## Example Copilot prompts and usage logging

- Safe prompt example (refactor): "Refactor `pages/about.html` to use semantic header/main/footer, add meta charset and viewport, and add labels for all form inputs. Keep service-worker registration unchanged."
- Unsafe prompt example (disallowed): "Update PayPal email and change checkout flow to use a new third-party provider." (requires human review)
- Tool usage log (include in PR body):
  - Tools used: `mcp_github_github_search_code` (searched for service-worker registration), `microsoft_docs_search` (HTML semantics guidance)
  - Key findings / links: list URLs or results used to make decisions

Why: concrete prompt examples and a short logging template make it easier to audit automated changes and speed reviewer sign-off.

If uncertain which tool to call for a specific question, ask one short clarifying question referencing the file path (e.g. `pages/store.html`) and whether you may use GitHub or Microsoft doc tools for research.

Please review these instructions and call out anything missing or specific you want emphasised.

### Available MCP servers (installed)

This repository has the following MCP servers installed and available. Prefer these servers and their tools when they are enabled:

- Context7 (library docs): mcp*upstash_conte*\* — use `resolve-library-id` then `get-library-docs` to fetch authoritative library documentation before implementing or upgrading library-specific code.
- GitHub (repo + code): mcp*github_github*\* — use for repository actions (create/update files, branches, PRs), code search (`mcp_github_github_search_code`) and interacting with issues/PRs. Always include a clear commit/PR message and list changed files when making programmatic changes.
- microsoft.docs.mcp (Microsoft Learn docs): mcp*microsoft_doc*\* — use `microsoft_docs_search`, `microsoft_code_sample_search` and `microsoft_docs_fetch` to ground Azure/Microsoft-related implementation and samples.
- sequentialthinking (planning): mcp_sequentialthinking — use for multi-step planning, design breakdowns and verification steps. Use this tool to generate a plan but do not publish internal chain-of-thought in PR descriptions; instead summarise the final decisions and action items in the PR body.

Operational notes

- Always confirm a given MCP server is enabled before calling its tools. If a server is unavailable, ask one short clarifying question referencing the file path you plan to inspect.
- Record every automated tool usage in the PR body (tool names and key results or links). This helps reviewers verify sources and decisions.
- Required policy: When available and enabled, GitHub Copilot MUST use Context7 (`mcp_upstash_conte`) for library documentation lookups and `mcp_sequentialthinking` for multi-step planning. Always confirm these servers are enabled before calling them, and record every automated tool usage (including which server/tool was used and a short justification) in the PR body.
- When using the sequentialthinking tool, extract the final plan and checklist and include that summary in the PR/commit body rather than raw internal reasoning.
