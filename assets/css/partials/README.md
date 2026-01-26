# CSS partials — organisation and guidance

This folder contains modular CSS partials imported by `../main.css`.

Purpose

- Keep the single `main.css` entrypoint while splitting implementation into
  small, focused files so changes are easier to review and maintain.

Import order (important)

- variables.css (CSS custom properties)
- config.css (General global configuration)
- settings.css (Broad settings)
- colours.css (Color definitions)
- typography.css (Font styles)
- spacing.css (Margins and paddings)
- sizing.css (Width and height utilities)
- breakpoints.css (Responsive design breakpoints)
- layout.css (Overall layout styles)
- media.css (Media queries)
- mixins.css (Reusable CSS snippets)
- clearfix.css (Clearfix utility)
- hidden.css (Hidden utility)
- accessibility.css (Accessibility helpers)
- animations.css (Keyframes and animation utilities)
- interactions.css (Interaction helpers)
- state.css (State-based styles)
- performance.css (Performance optimizations)
- theme.css (Theming and skinning)
- browser-fixes.css (Browser-specific fixes)
- reset.css (Style resets)
- unstyle.css (Unstyled base elements)
- normalize.css (Normalization styles)
- sanitize.css (Sanitization styles)
- base.css (Base document styles)
- selections.css (Text selection styles)
- all.css (Global element styles)
- html.css (HTML element styles)
- body.css (Body element styles)
- title.css (Title element styles)
- headings.css (Heading element styles)
- paragraphs.css (Paragraph element styles)
- groups.css (Grouping element styles)
- lists.css (List element styles)
- links.css (Link element styles)
- images.css (Image element styles)
- tables.css (Table element styles)
- forms.css (Form element styles)
- labels.css (Label element styles)
- inputs.css (Input element styles)
- buttons.css (Button element styles)
- nav.css (Navigation element styles)
- header.css (Header element styles)
- footer.css (Footer element styles)
- wrapper.css (Object layer wrapper)
- container.css (Container object styles)
- flexbox.css (Flexbox object styles)
- grid.css (Grid object styles)
- media-object.css (Media object styles)
- modals.css (Modal object styles)
- responsive.css (Responsive object styles)
- templates.css (Template-specific styles)
- shadow-dom.css (Shadow DOM styles)
- navigation-menu.css (Navigation menu styles)
- categories.css (Category-specific styles)
- products.css (Product-specific styles)
- components.css (Component-specific styles)
- input-fields.css (Input field styles)
- badges.css (Badge component styles)
- progress-bars.css (Progress bar styles)
- loaders.css (Loader component styles)
- sliders.css (Slider component styles)
- carousels.css (Carousel component styles)
- accordions.css (Accordion component styles)
- tabs.css (Tab component styles)
- tooltips.css (Tooltip component styles)
- modals-overlays.css (Modal and overlay styles)
- popups.css (Popup component styles)
- alerts.css (Alert component styles)
- notifications.css (Notification component styles)
- toasts.css (Toast component styles)
- cart.css (Cart-specific styles)
- checkout.css (Checkout-specific styles)
- transitions.css (Transition component styles)
- utilities.css

Conventions

- Keep each file scoped and small — prefer adding a new partial if a file
  grows large or covers multiple concerns.

- Reference variables (from `variables.css`) only after that file is
  imported in `main.css`.

- Use `--` CSS custom properties for theming tokens; prefer semantic names.

- Use Australian English for comments and any text (e.g. "organise").

Quick checklist for changes

- Keep `main.css` as the single entrypoint; do not link partials from HTML.

- Document any structural change in this README briefly.
- Note (2026-01-25): Spacing utilities moved to `spacing.css`, layout helpers moved to `layout.css`, and base typographic rules moved to `typography.css`. Additionally, `colours.css`, `config.css`, `media.css`, and `sizing.css` were populated with conservative helpers and tokens. Make small, reversible commits and run visual smoke tests when moving additional rules.
- Note (2026-01-26): Migrated base HTML typography to `partials/elements/html.css`; moved global `font-feature-settings` to `partials/elements/all.css`; moved heading font-feature settings to `partials/elements/headings.css`; and moved basic link/button bases to `partials/elements/links.css` and `partials/elements/buttons.css`. Keep migrations small and verify appearance across `pages/*.html` and store/checkout flows.
- Note (2026-01-26): Added conservative element defaults for `body`, `p`, `ul/ol`, `img`, `table`, and `label` in `partials/elements/*`. These defaults are minimal and reversible — run visual/a11y smoke tests on store and checkout pages before merging larger changes.
- Note (2026-01-26): Migrated control padding/transition into `partials/elements/input.css`; added input focus/disabled rules and button baseline/disabled rules in `partials/elements/buttons.css`. Review forms and search controls for layout parity before merging.
- Note (2026-01-26): Moved `@media print` rules from `partials/categories.css` to `partials/elements/all.css` to centralise element print styles (a, abbr, pre, blockquote, tr, img, headings, etc.).
- Note (2026-01-26): Added visible keyboard focus styles for buttons in `partials/elements/buttons.css` to improve keyboard navigation visibility and accessibility.
- Note (2026-01-26): Added Objects layer partials in `partials/objects/` and migrated layout-only rules into them: `.container` → `partials/objects/container.css`, `.grid` → `partials/objects/grid.css`, `.stack`/`.center-row` → `partials/objects/flexbox.css`, `.responsive-media` → `partials/objects/media-object.css`. Objects should remain undecorated and layout-focused; keep one-off utilities using the `u-` prefix. Before merging run visual/a11y smoke tests on `index.html`, `pages/store/*.html`, `cart.html`, and `checkout.html` to verify parity.

If you want a different split or a build pipeline (Sass/partials compilation),
open an issue so we can discuss the approach and testing steps.
