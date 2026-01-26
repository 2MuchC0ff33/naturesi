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
Up to batch 7

```toon
total_micro_batches: 20
batches[20]:
  -
    batch_id: 1
    title: "Global Scan: JS Module Inventory"
    target_paths[1]: assets/js/modules/**/*.js
    focus[3]: Build reference map,"Identify modules, exports, and imports",Detect obvious dead modules or unused exports
    actions[3]: "Parse all JS modules to list exports, imports, and default initialisers",Record DOM selectors and data-attributes referenced by each module,"Note any legacy patterns (var, function hoisting reliance, old polyfills) for later cleanup"
    do_not_break[12]: cart,checkout,PayPal,navigation,modals,overlays,accordions,tabs,popups,service worker,PWA,data-attributes
    deliverables[3]: module_inventory.json,selector_reference.json,initial_findings.md
    recommended_manual_QA[1]: None yet; planning-only batch
  -
    batch_id: 2
    title: "Global Scan: HTML Template Inventory"
    target_paths[6]: index.html,offline.html,404.html,pages/*.html,pages/store/*.html,pages/payment/*.html
    focus[3]: Enumerate templates,"Map IDs, classes, data-attributes",Find inline scripts
    actions[3]: "Extract all classes, IDs, data attributes, and inline scripts",Cross-reference against the JS selector_reference,Flag mismatches with new ITCSS class architecture
    do_not_break[4]: SEO-critical markup,headings,alt tags,metadata
    deliverables[3]: html_inventory.json,inline_scripts_list.json,mismatch_report.json
    recommended_manual_QA[1]: Open a representative set of pages to visually confirm structure parity with ITCSS expectations
  -
    batch_id: 3
    title: Reference Map Consolidation
    target_paths[3]: assets/js/modules/**/*.js,index.html,pages/**/*.html
    focus[2]: Unify JS–HTML mapping,Identify dead selectors and dead code paths
    actions[3]: Merge JS and HTML inventories into a single reference map,Mark selectors that do not appear in HTML as potential dead paths,Identify modules whose DOM targets no longer exist
    do_not_break[1]: data-attribute driven behaviour
    deliverables[2]: global_reference_map.json,dead_path_candidates.json
    recommended_manual_QA[1]: Spot-check a few mapped selectors in DevTools to confirm presence and uniqueness
  -
    batch_id: 4
    title: "DOM Selector Modernisation: Navigation & Header"
    target_paths[3]: assets/js/modules/**/nav*.js,assets/js/modules/**/header*.js,pages/**/*.html
    focus[2]: Align selectors to ITCSS,Replace fragile selectors with stable classes or data-attributes
    actions[3]: "Update query selectors for navigation toggles, menus, and header utilities",Introduce data-attributes where appropriate while keeping legacy selectors intact if risky,Verify mobile and desktop behaviour remains consistent
    do_not_break[2]: navigation/menu JS,keyboard navigation
    deliverables[2]: files_changed_list.json,summary_nav_header.md
    recommended_manual_QA[1]: "Test hamburger menu, desktop menu hover/focus, tab/enter behaviour, escape to close"
  -
    batch_id: 5
    title: "DOM Selector Modernisation: Modals, Overlays, Dialogs"
    target_paths[3]: assets/js/modules/**/modal*.js,assets/js/modules/**/overlay*.js,pages/**/*.html
    focus[2]: Stabilise modal triggers and containers,Ensure cross-device compatibility
    actions[3]: Replace brittle descendant selectors with component root selectors,Add or align data-modal-target attributes for clarity,Retain old selectors if removing them risks regressions
    do_not_break[3]: modal dialogs,overlays,focus restoration
    deliverables[2]: files_changed_list.json,summary_modals_overlays.md
    recommended_manual_QA[1]: "Open/close flows via click, ESC, backdrop; focus trapping and restoration; screen reader announcements"
  -
    batch_id: 6
    title: "DOM Selector Modernisation: Product Listing, Filters, Sorting"
    target_paths[4]: assets/js/modules/**/product*.js,assets/js/modules/**/filter*.js,assets/js/modules/**/sort*.js,pages/store/*.html
    focus[3]: Robust selectors,Data-attribute targeting,Event safety across viewports
    actions[3]: "Align product card, pagination, filter, and sort selectors to new ITCSS classes",Prefer data-attributes for interactive controls,Audit for duplicate or nested listeners tied to old markup
    do_not_break[3]: filtering,sorting,pagination
    deliverables[2]: files_changed_list.json,summary_listing_filters.md
    recommended_manual_QA[1]: "Apply filters, clear filters, change sort order, paginate; verify no double-handling of events"
  -
    batch_id: 7
    title: "DOM Selector Modernisation: Cart and Checkout Touchpoints"
    target_paths[3]: assets/js/modules/**/cart*.js,assets/js/modules/**/checkout*.js,pages/payment/*.html
    focus[2]: Safe alignment of selectors,Preserve all transactional flows
    actions[3]: Modernise selectors for add/remove/update cart actions without altering business logic,Ensure delegation targets exist on both mobile and desktop templates,Keep original selectors alongside new ones if any risk is detected
    do_not_break[3]: cart logic,checkout logic,PayPal integration
    deliverables[2]: files_changed_list.json,summary_cart_checkout_selectors.md
    recommended_manual_QA[1]: "Add item, change quantity, remove item, proceed to checkout, validate totals and PayPal button rendering"
  -
    batch_id: 8
    title: "Legacy JS Cleanup: Dead Code and Commented Blocks"
    target_paths[1]: assets/js/modules/**/*.js
    focus[3]: Remove unused functions,Prune commented-out code,Delete stale feature flags
    actions[3]: Remove functions not referenced in the global map,Delete commented legacy blocks after confirming no runtime references,Update module headers to reflect current responsibilities
    do_not_break[1]: core flows listed in constraints
    deliverables[2]: files_changed_list.json,summary_dead_code_cleanup.md
    recommended_manual_QA[1]: Smoke test main user journeys to ensure no code path was implicitly relied upon
  -
    batch_id: 9
    title: "Legacy JS Cleanup: Duplicate Listeners and Timing Anti-patterns"
    target_paths[1]: assets/js/modules/**/*.js
    focus[3]: Remove duplicate listeners,Replace unnecessary setTimeout patterns,Guard against double-binding
    actions[3]: Consolidate multiple identical listeners into a single delegated handler,Replace arbitrary timeouts with lifecycle or event-driven triggers,Introduce idempotent initialisers to avoid re-attachment
    do_not_break[2]: dynamic content initialisation,lazy-rendered sections
    deliverables[2]: files_changed_list.json,summary_listeners_timing.md
    recommended_manual_QA[1]: Navigate between views multiple times to ensure no event duplication or memory leaks
  -
    batch_id: 10
    title: "Event Handling: Systematic Event Delegation"
    target_paths[2]: assets/js/modules/**/*.js,pages/**/*.html
    focus[2]: Adopt event delegation where safe,Minimise DOM assumptions
    actions[3]: Refactor per-element listeners to delegated handlers on stable container nodes,Use matches() with data-attributes or stable classes,Ensure handlers work across dynamically injected elements
    do_not_break[2]: keyboard interactions,touch interactions
    deliverables[2]: files_changed_list.json,summary_event_delegation.md
    recommended_manual_QA[1]: Trigger events on dynamically loaded items; verify both touch and keyboard activation
  -
    batch_id: 11
    title: Accessibility Enhancements in Interactive Components
    target_paths[2]: "assets/js/modules/**/{modal,overlay,tab,accordion,nav}*.js",pages/**/*.html
    focus[3]: Focus management,ARIA attributes,Escape-to-close
    actions[3]: Ensure focus is trapped within modals and restored on close,"Toggle aria-expanded, aria-hidden, aria-controls appropriately",Add ESC to close and ensure SR-only announcements where needed
    do_not_break[1]: current visual behaviour
    deliverables[2]: files_changed_list.json,summary_accessibility.md
    recommended_manual_QA[1]: Keyboard-only walkthrough; screen reader smoke test for key flows
  -
    batch_id: 12
    title: "Tokenisation: Replace Hard-coded Colours and Timings"
    target_paths[1]: assets/js/modules/**/*.js
    focus[2]: Read CSS custom properties safely,Centralise timings
    actions[3]: Replace colour literals with values read from computed styles or configuration,Centralise animation durations and delays into a constants module,Guard fallbacks if tokens are not available at runtime
    do_not_break[2]: visual consistency,animation sequencing
    deliverables[2]: files_changed_list.json,summary_tokenisation_colours_timings.md
    recommended_manual_QA[1]: Visual regression spot-check on key components and transitions
  -
    batch_id: 13
    title: "Breakpoint Strategy: Remove Magic Numbers"
    target_paths[1]: assets/js/modules/**/*.js
    focus[2]: Replace hard-coded breakpoints with shared tokens,Respect responsive design
    actions[3]: Replace window.innerWidth magic numbers with named breakpoints from CSS or a shared config,Use matchMedia with token-driven queries,"Verify logic works across mobile, tablet, and desktop"
    do_not_break[2]: responsive behaviour,layout-driven logic
    deliverables[2]: files_changed_list.json,summary_breakpoints.md
    recommended_manual_QA[1]: Resize tests at common breakpoints; confirm feature parity across sizes
  -
    batch_id: 14
    title: "HTML Template Cleanup: Remove Pre‑ITCSS Classes and Inline Styles"
    target_paths[2]: index.html,pages/**/*.html
    focus[2]: Strip unused classes,Apply Utilities over inline styles
    actions[3]: Remove legacy classes no longer present in ITCSS,Replace repetitive inline styles with utility classes,Ensure no semantic or accessibility regressions
    do_not_break[2]: semantic structure,SEO elements
    deliverables[2]: files_changed_list.json,summary_html_cleanup.md
    recommended_manual_QA[1]: Visual pass across key templates; confirm no lost spacing or alignment
  -
    batch_id: 15
    title: HTML Semantics and Labelling Integrity
    target_paths[2]: index.html,pages/**/*.html
    focus[3]: Heading hierarchy,Alt text quality,Form labels and associations
    actions[3]: Correct heading levels to maintain a logical outline,Ensure images have meaningful alt text or empty alt when decorative,Link labels to inputs with for/id and aria-describedby where needed
    do_not_break[1]: existing tracking or analytics attributes
    deliverables[2]: files_changed_list.json,summary_semantics_labelling.md
    recommended_manual_QA[1]: Audit with aXe or Lighthouse; keyboard traverse key forms
  -
    batch_id: 16
    title: "Performance: Images and Media"
    target_paths[2]: index.html,pages/**/*.html
    focus[3]: "loading=\\"lazy\\"","decoding=\\"async\\"",Prevent layout shifts
    actions[3]: "Add loading=\\"lazy\\" to non-critical images and iframes","Add decoding=\\"async\\" where supported",Ensure width/height or aspect-ratio is set to avoid CLS
    do_not_break[1]: critical LCP media on above-the-fold views
    deliverables[2]: files_changed_list.json,summary_media_performance.md
    recommended_manual_QA[1]: Lighthouse performance check; verify hero images remain eager if required
  -
    batch_id: 17
    title: "Script Hygiene: Inline → Module (Safe Only)"
    target_paths[3]: index.html,pages/**/*.html,assets/js/modules/**/*.js
    focus[2]: Move safe inline scripts to modules,Avoid behavioural changes
    actions[3]: Identify inline scripts that can be migrated without altering execution order,Create small modules imported at the right time,Retain inline if any risk to order-dependent behaviour
    do_not_break[2]: checkout and payment initialisation order,service worker registration
    deliverables[2]: files_changed_list.json,summary_script_hygiene.md
    recommended_manual_QA[1]: Validate critical initialisation still occurs in the correct sequence
  -
    batch_id: 18
    title: "PWA Integrity: Service Worker, Caching, Manifest Cross-check"
    target_paths[4]: service worker file(s),manifest.json,assets/js/modules/**/*.js,index.html
    focus[2]: No regressions to offline behaviour,Cache strategies unaffected
    actions[3]: Confirm no selector or path changes impacted SW routing or pre-cache lists,Verify registration code remains intact and modernised safely,Check manifest links and icons remain valid
    do_not_break[3]: offline mode,update flow,cache versioning
    deliverables[2]: files_changed_list.json,summary_pwa_integrity.md
    recommended_manual_QA[1]: "Test offline: install, navigate key pages, update SW, confirm cache bust behaviour"
  -
    batch_id: 19
    title: "Transactional Flows: Cart, Checkout, PayPal Final Validation Fixes"
    target_paths[3]: assets/js/modules/**/cart*.js,assets/js/modules/**/checkout*.js,pages/payment/*.html
    focus[2]: Address any regressions found,Tighten error handling and idempotency
    actions[3]: Re-test end-to-end add-to-cart through payment handoff,"Apply minimal, safe fixes to selectors or handlers identified during QA",Ensure idempotent actions for repeated clicks or slow networks
    do_not_break[3]: PayPal integration,price and tax calculations,form validation
    deliverables[2]: files_changed_list.json,summary_transactional_fixes.md
    recommended_manual_QA[1]: Full checkout journey with different payment paths and network throttling
  -
    batch_id: 20
    title: Final Reconciliation and Cross-Device QA
    target_paths[1]: entire codebase
    focus[3]: Re-scan against ITCSS,Cross-device and theme checks,Close-out report
    actions[3]: Run final grep against outdated classes or selectors,"Validate on mobile, tablet, desktop; light and dark (if present)",Compile final summary with recommended manual test cases
    do_not_break[1]: any previously validated flows
    deliverables[3]: final_change_report.md,manual_QA_checklist.md,post_optimisation_readme.md
    recommended_manual_QA[1]: "Execute checklist across browsers and devices; confirm no CLS, JS errors, or accessibility regressions"
```


```txt
feedback:
- [ ] Homepage needs to be more engaging visually.
- [ ] Instead of drop down menu for Product Categories store page in header navigation, use a mega menu to show featured products and list of categories in a single row in the header navigation menu horizontally.
- [ ] Logo in header should be slightly larger for better visibility.
- [ ] Make reviews look real by adding user profile pictures next to each review.
- [ ] Add banner hero image at the top of the homepage to highlight current promotions or featured products.
- [ ] Feature products on the homepage should be displayed in a grid layout instead of a single column for better visual appeal.
- [ ] Add hover effects to product images on the store page to enhance interactivity.
- [ ] Footer section needs to be tightened up with better spacing and alignment of elements.
```


