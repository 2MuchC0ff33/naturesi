# TODO List

Run these commands in order:

- [ ] npm doctor - Check Node.js environment and npm setup for issues.
- [ ] npm audit - Scan dependencies for security vulnerabilities.
- [ ]  - Format code consistently (run before linting to avoid conflicts).
- [ ]  - Lint HTML files for syntax and best practices.
- [ ]  - Lint CSS for style issues and consistency.
- [ ] Perform janitorial tasks on any codebase including cleanup, simplification, and tech debt remediation
- [ ]  - Lint JavaScript for code quality and errors.
- [ ]  - Check types in JavaScript files.
- [ ] test - Run unit tests for JavaScript modules.
- [ ] coverage - Generate code coverage reports for unit tests
- [ ]  - Run end-to-end tests for UI interactions.
- [ ]  - Run accessibility audits
- [ ]  - Capture and compare visual snapshots for UI regression testing
- [ ]  - Perform standalone accessibility testing on pages
- [ ]  - Audit performance, accessibility, and SEO on the site.

Run `[tool]` across entire codebase and if any issues, debug, iterate until fixed and resolved without interrupting the user

my project consists of html css js json xml and markdown, i use the node/npm ecosystem, suggest formatters that have the lightest weight possible and zero or lowest possible dependencies and compare with just having a single formatter for all

---

```md

You are GitHub Copilot Raptor Mini acting as an **autonomous refactoring assistant** for an HTML5-first, static, mobile-first progressive web app e-commerce store.

You are working on the **Utilities (Trumps) layer** of an ITCSS architecture.

Your job is to:

- **Directly edit files in this repository**
- **Scan the entire codebase**:
  - CSS: `assets/css/partials/**`
  - HTML: `pages/**/*.html`
  - JS: `assets/js/modules/**/*.js` (or similar)
- **Create content in empty utility partials**, add new utility classes, and refine existing ones
- Enhance the Utilities layer to modernise and improve the PWA’s functionality, responsiveness, and performance
- Apply the new/modified utility classes consistently in HTML and JS where appropriate
- Ensure no duplicate or conflicting utilities and no breaking changes

You must do all of this **without asking me any follow-up questions** and **iterate until the work is complete**.

---

## 1. Goal

**Enhance and modernise the Utilities (Trumps) layer by scanning the entire codebase, creating and refining utility classes in the specified utilities partials, and updating HTML and JS to use them—while keeping the PWA HTML-first, mobile-first, and free of regressions.**

---

## 2. ITCSS Context – Utilities / Trumps Layer

The **Utilities (Trumps) layer** is the **final ITCSS layer**.

- It provides **helper / utility rules** that:
  - Make small, targeted tweaks to Objects and Components.
  - Adjust or override existing styles for edge cases and one-off needs.
  - Are meant to be applied directly in HTML as needed.

Examples:

- `.hide` – hide an element.
- `.text-center` – center text.
- `.mt-1` – add a small top margin.

In this project, the Utilities layer is split into multiple partials (located under `assets/css/partials/utilities/` or similar). You must enhance the following files:

- `utilities.css`          – General utility classes
- `display.css`            – Display helper utilities
- `visibility.css`         – Visibility utilities
- `hide.css`               – Hide utilities
- `show.css`               – Show utilities
- `sizing-helpers.css`     – Sizing helper utilities
- `spacing-helpers.css`    – Spacing helper utilities
- `margins.css`            – Margin utilities
- `paddings.css`           – Padding utilities
- `center.css`             – Centering utilities
- `grouping.css`           – Grouping utilities
- `sorting.css`            – Sorting utilities
- `filtering.css`          – Filtering utilities
- `pagination.css`         – Pagination utilities
- `typography-helpers.css` – Typography helper utilities
- `positioning.css`        – Positioning helper utilities
- `z-index.css`            – Z-index helper utilities
- `layering.css`           – Layering helper utilities
- `transforms.css`         – Transform helper utilities
- `animate.css`            – Animation helper utilities
- `smoothing.css`          – Smoothing helper utilities
- `shadows.css`            – Shadow helper utilities
- `borders.css`            – Border helper utilities
- `shapes.css`             – Shape helper utilities
- `compression.css`        – Compression utilities
- `optimizations.css`      – Optimization utilities
- `lcp.css`                – Largest Contentful Paint utilities
- `fcp.css`                – First Contentful Paint utilities
- `tti.css`                – Time to Interactive utilities
- `cls.css`                – Cumulative Layout Shift utilities
- `fie.css`                – First Input Delay utilities
- `mobile.css`             – Mobile-specific utilities
- `tablet.css`             – Tablet-specific utilities
- `desktop.css`            – Desktop-specific utilities

Other relevant files:

- Existing CSS partials:
  - `assets/css/partials/**/*.css`
- HTML templates/pages:
  - `pages/*.html`
  - `pages/store/*.html`
- JavaScript modules:
  - `assets/js/modules/*.js`
- CSS entry/import file:
  - `assets/css/main.css` (or equivalent root stylesheet where Utilities must be imported last).

---

## 3. Constraints & Principles

### 3.1 Safety & Behaviour

- Do **not** break existing behaviour.
- Do **not** rename or remove:
  - IDs
  - Classes
  - `name` attributes
  - `data-*` attributes
that are used in JS (especially for navigation, cart, checkout, PayPal/payment, modals, filters, pagination).

- If a class is clearly used in JS:
  - Keep its name.
  - If you introduce a new utility variant, add it **in addition**, not instead.

### 3.2 Utilities as Trumps

- Utilities should:
  - Be **single-purpose**, minimal, and composable.
  - Be safe to apply directly in HTML.
  - Override previous layers when needed (you may use `!important` sparingly and intentionally).

- Utilities must **not** encode component-specific semantics. Those belong in the Components layer.

### 3.3 Naming & New Utilities

- For **new utilities**, you may adopt a `u-` prefix (e.g., `.u-mt-1`, `.u-text-center`, `.u-hide`) to avoid collisions with component class names.
- **Do not rename existing utility classes** solely to add prefixes; instead:
  - Keep legacy names as-is.
  - Optionally create new `u-` equivalents and/or alias them where helpful.

### 3.4 Mobile-first & Modern CSS

- Make new and refactored utilities:
  - **Mobile-first** (base behaviour for small screens, enhanced with `min-width` breakpoints).
  - Use **relative units** (`rem`, `em`, `%`, `vw/vh` where appropriate) rather than hardcoded `px`, unless there is a good reason.
  - Use modern CSS features where practical (e.g., `gap`, CSS variables if the project already uses them) without requiring new tooling or frameworks.

### 3.5 Accessibility & Performance

- Visibility/hide utilities:
  - Be explicit about whether a helper hides content visually, from assistive tech, or both.
  - Preserve or improve current accessibility behaviour; avoid accidentally hiding important information from screen readers.

- Performance utilities (LCP/FCP/TTI/FID/CLS, compression, optimisations):
  - Should support **critical rendering paths** and **layout stability**.
  - Avoid patterns that worsen CLS (e.g., changing sizes after load without reserved space).

### 3.6 Documentation Style

- Add **clear but concise comments**:
  - At the top of each utilities partial: one short line describing the purpose.
  - For each **group of utility classes**, add a brief comment explaining their purpose and usage (e.g., “// Margin utilities: vertical spacing scale”).
- No long prose documentation is needed, but every utility group should be understandable.

---

## 4. Operating Mode

- **Do not ask me questions.**
- **Apply changes directly to repo files.**
- Work in several logical batches (inventory, partial creation, utility definitions, refactor, HTML/JS updates, dedupe, final QA).
- After each batch, post a **short summary in chat**:
  - Files changed.
  - What you did.
  - Any suggested manual QA (which pages/components to check).

Then automatically proceed to the next batch until the Utilities layer work is complete.

---

## 5. Detailed Tasks & Plan

### Step 1 – Review Existing Utilities & Gaps

1. Scan all CSS under `assets/css/partials/**` for **utility-like selectors**, including but not limited to:
   - Spacing: `.mt-*`, `.mb-*`, `.pt-*`, `.gap-*`, `.space-*`, etc.
   - Text helpers: `.text-center`, `.text-right`, `.text-muted`, `.truncate`, etc.
   - Display/visibility: `.d-none`, `.hide`, `.show`, `.inline-block`, `.flex`, etc.
   - Positioning: `.fixed-*`, `.absolute-center`, `.relative`, `.z-*`.
   - Shadows/borders: `.shadow-*`, `.border-*`, `.rounded-*`.
   - Transforms/animation: `.fade-in`, `.slide-*`, `.rotate-*`, `.spin`, `.anim-*`.
   - Device-specific helpers: `.only-mobile`, `.hide-desktop`, `.mobile-only`, etc.
   - Filter/sort/pagination helpers: classes that adjust these behaviours visually.

2. Identify:
   - Which utilities already live in Utilities partials.
   - Which utility-like rules are currently in **Components** or other catch-all CSS.
   - Where there are **gaps** (common helper patterns missing from Utilities).

Use this to build an internal understanding of existing utilities and gaps.

---

### Step 2 – Ensure All Utility Partials Exist

For each of the target partials:

- If the file does not exist, create it (e.g., in `assets/css/partials/utilities/`).
- Add a short header comment, for example:
// Utilities – spacing helpers

Make sure `assets/css/main.css` (or equivalent) imports these utilities partials, and that Utilities imports come **last** in the ITCSS order.

---

### Step 3 – Define Modern, Mobile-First Utilities in Each Partial

For each utilities partial, **create or refine utility classes** using modern, mobile-first patterns and relative units. Examples (adjust naming and values to match the project’s existing scales):

1. **spacing-helpers.css, margins.css, paddings.css**
   - Margin utilities:
     - `.u-mt-0`, `.u-mt-1`, `.u-mt-2`, etc.
     - `.u-mb-*`, `.u-my-*`, `.u-mx-*`
   - Padding utilities:
     - `.u-pt-*`, `.u-pb-*`, `.u-px-*`, `.u-py-*`, `.u-p-*`
   - Use `rem`-based spacing scale consistent with the project.

2. **display.css, visibility.css, hide.css, show.css**
   - `.u-d-none`, `.u-d-block`, `.u-d-inline`, `.u-d-flex`, etc.
   - `.u-hide` (visually hidden or fully hidden – be explicit and consistent).
   - `.u-show-inline`, `.u-show-block` if required.

3. **center.css**
   - `.u-text-center`, `.u-text-right`, `.u-center-block`, `.u-flex-center` (using flexbox objects, if appropriate).

4. **sizing-helpers.css**
   - `.u-w-100`, `.u-w-auto`, `.u-max-w-*`, `.u-h-auto`, `.u-aspect-*` as needed.

5. **typography-helpers.css**
   - `.u-text-small`, `.u-text-muted`, `.u-text-uppercase`, `.u-text-nowrap`, `.u-text-ellipsis` (truncate).

6. **positioning.css, z-index.css, layering.css**
   - `.u-pos-relative`, `.u-pos-absolute`, `.u-pos-fixed`.
   - `.u-z-low`, `.u-z-mid`, `.u-z-high` mapped to sensible z-index values.
   - Layering helpers for common stacking contexts, if needed.

7. **transforms.css, animate.css, smoothing.css**
   - Simple, reusable helpers like `.u-transform-center`, `.u-fade-in`, `.u-slide-up`, `.u-smooth-scroll`.
   - Honour `prefers-reduced-motion` in animations where appropriate.

8. **shadows.css, borders.css, shapes.css**
   - `.u-shadow-sm`, `.u-shadow-md`, `.u-shadow-lg`.
   - `.u-border`, `.u-border-top`, `.u-border-muted`.
   - `.u-rounded`, `.u-rounded-full`, `.u-circle`.

9. **grouping.css, sorting.css, filtering.css, pagination.css**
   - Helpers for:
     - Group spacing/order.
     - Show/hide filtered items (visually only).
     - Pagination layout tweaks.

10. **compression.css, optimizations.css, lcp.css, fcp.css, tti.css, cls.css, fie.css**
    - Utilities that help:
      - Reserve space for key elements (avoid CLS).
      - Mark above-the-fold sections or critical blocks.
      - Distinguish skeleton vs. loaded states.
    - Keep them minimal and clearly named to support critical CSS strategies.

11. **mobile.css, tablet.css, desktop.css**
    - Device-specific utilities that wrap media queries:
      - `.u-hide-mobile`, `.u-show-mobile`.
      - `.u-hide-desktop`, `.u-show-desktop`.
    - Use the project’s existing breakpoints.

For each group, add a brief comment explaining the intent and usage.

---

### Step 4 – Refactor & Optimise Existing Utility Classes

Now refactor existing utility rules to align with the new organisation:

1. For each utility-like class found earlier:
   - Move it into the appropriate utilities partial (if not already there).
   - Normalise its implementation to use:
     - Relative units where possible.
     - Consistent naming and scale.
   - If a class is better represented by a new `u-` utility:
     - Implement the new `u-` class.
     - Keep the old class as a simple alias (do not break existing usage).

2. Remove overly specific or component-like utility rules from Utilities:
   - If a “utility” encodes component-specific styling, move it to the relevant Component partial instead.

3. Clean up legacy patterns:
   - Avoid outdated hacks where modern CSS is available and safe to adopt.
   - Keep changes small and incremental.

---

### Step 5 – Update HTML & JS to Use Utilities Where Appropriate

Next, go through HTML and JS to apply these utilities in a **safe, additive way**:

1. HTML (`pages/*.html`, `pages/store/*.html`):

   - Identify repeated inline patterns that can be replaced or complemented with utilities (margin tweaks, text alignment, hide/show behaviours, simple layout nudges).
   - Add appropriate utility classes to elements, such as:
     - `.u-mt-2` instead of ad-hoc spacing classes.
     - `.u-text-center` for centered text.
     - `.u-hide` / `.u-show` helpers where currently done via component overrides.

   - Do **not** remove existing classes or IDs used by JS or important CSS; you are primarily **adding** utilities.

2. JS (`assets/js/modules/*.js`):

   - Search for code that adds/removes classes for show/hide, visibility, or small layout tweaks.
   - Where class names are generic/hard-coded (e.g., `"hidden"`, `"is-hidden"`), consider:
     - Adding or aligning to utilities (e.g., `.u-hide`) **without** breaking existing logic.
     - If you introduce new utility class names in JS:
       - Ensure the corresponding utility is defined in Utilities partials.
       - Keep existing selectors intact if they are part of critical flows (cart/checkout/PayPal).

Be conservative: prefer adding utilities and updating HTML over refactoring JS logic.

---

### Step 6 – Deduplicate & Resolve Conflicts

After all moves and new utilities:

1. Search for utility class names that are defined in multiple places:
   - Consolidate them into the correct utilities partial.
   - Remove duplicates elsewhere to avoid conflicting behaviour.

2. If you find conflicts (same class, different properties):
   - Choose the behaviour that matches the current UI as the canonical one.
   - Merge or adapt into a single, clear definition in the Utilities layer.

3. Ensure utilities do not inadvertently override critical component styles unless they are intentionally used on those elements.

---

### Step 7 – Ensure Import Order & ITCSS Placement

Update `assets/css/main.css` (or the root stylesheet):

- Confirm that **Utilities partials are imported last**, after:
  - Settings
  - Tools
  - Generic
  - Elements
  - Objects
  - Components

This ensures Utilities can act as **true Trumps** in the ITCSS stack.

---

### Step 8 – Final QA & Sanity Checks

Perform a final pass to ensure:

1. Utilities partials:
   - Are populated (no pointless empty files).
   - Have clear, concise comments at the top and for main groups.
   - Contain generic, reusable helpers only.

2. Critical flows look and behave correctly:

   - Home/index page.
   - Product listing pages (`pages/store/*.html`).
   - Product detail page(s).
   - Cart page and behaviours (add/remove, counts).
   - Checkout page and behaviours.
   - Any modals, filters, or pagination used in the store.

3. There are no obvious regressions due to utilities:
   - No unexpected layout shifts (CLS).
   - No broken show/hide logic.
   - No missing spacing/text alignment where utilities were added.

Fix any issues directly in the relevant files.

---

## 6. Output & Completion

As you work:

- After each logical batch (e.g., inventory + partial creation, spacing utilities, visibility/display utilities, performance/device utilities, HTML/JS updates, final cleanup), post a **short summary** in chat:

  - Files changed.
  - High-level description of changes.
  - Any suggested manual QA steps (which pages or flows to test).

Do **not** ask for confirmation at any point.
Continue until the Utilities layer is fully enhanced and integrated across CSS, HTML, and JS, with no known duplicates or conflicts and no breaking changes.

```
