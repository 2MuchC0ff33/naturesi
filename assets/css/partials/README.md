# CSS partials — organisation and guidance

This folder contains modular Sass partials imported by `../main.scss`.

Purpose

- Keep the single `main.scss` entrypoint while splitting implementation into
  small, focused files so changes are easier to review and maintain.

Import order (important)

- tokens.scss (Open Props & project token aliases)
- variables.scss (CSS custom properties)
- config.scss (General global configuration)
- settings.scss (Broad settings)
- colours.scss (Color definitions)
- typography.scss (Font styles)
- spacing.scss (Margins and paddings)
- sizing.scss (Width and height utilities)
- breakpoints.scss (Responsive design breakpoints)
- layout.scss (Overall layout styles)
- media.scss (Media queries)
- mixins.scss (Reusable CSS snippets)
- clearfix.scss (Clearfix utility)
- hidden.scss (Hidden utility)
- accessibility.scss (Accessibility helpers)
- animations.scss (Keyframes and animation utilities)
- interactions.scss (Interaction helpers)
- state.scss (State-based styles)
- performance.scss (Performance optimizations)
- theme.scss (Theming and skinning)
- browser-fixes.scss (Browser-specific fixes)
- reset.scss (Style resets)
- unstyle.scss (Unstyled base elements)
- normalize.scss (Normalization styles)
- sanitize.scss (Sanitization styles)
- base.scss (Base document styles)
- selections.scss (Text selection styles)
- all.scss (Global element styles)
- html.scss (HTML element styles)
- body.scss (Body element styles)
- title.scss (Title element styles)
- headings.scss (Heading element styles)
- paragraphs.scss (Paragraph element styles)
- groups.scss (Grouping element styles)
- lists.scss (List element styles)
- links.scss (Link element styles)
- images.scss (Image element styles)
- tables.scss (Table element styles)
- forms.scss (Form element styles)
- labels.scss (Label element styles)
- inputs.scss (Input element styles)
- buttons.scss (Button element styles)
- nav.scss (Navigation element styles)
- header.scss (Header element styles)
- footer.scss (Footer element styles)
- wrapper.scss (Object layer wrapper)
- container.scss (Container object styles)
- flexbox.scss (Flexbox object styles)
- grid.scss (Grid object styles)
- media-object.scss (Media object styles)
- modals.scss (Modal object styles)
- responsive.scss (Responsive object styles)
- templates.scss (Template-specific styles)
- shadow-dom.scss (Shadow DOM styles)
- navigation-menu.scss (Navigation menu styles)
- categories.scss (Category-specific styles)
- products.scss (Product-specific styles)
- components.scss (Component-specific styles)
- input-fields.scss (Input field styles)
- badges.scss (Badge component styles)
- progress-bars.scss (Progress bar styles)
- loaders.scss (Loader component styles)
- sliders.scss (Slider component styles)
- carousels.scss (Carousel component styles)
- accordions.scss (Accordion component styles)
- tabs.scss (Tab component styles)
- tooltips.scss (Tooltip component styles)
- modals-overlays.scss (Modal and overlay styles)
- popups.scss (Popup component styles)
- alerts.scss (Alert component styles)
- notifications.scss (Notification component styles)
- toasts.scss (Toast component styles)
- cart.scss (Cart-specific styles)
- checkout.scss (Checkout-specific styles)
- transitions.scss (Transition component styles)
     - utilities.scss (General utility classes)
     - display.scss (Display helper utilities)
     - visibility.scss (Visibility utilities)
     - hide.scss (Hide utilities)
     - show.scss (Show utilities)
     - sizing-helpers.scss (Sizing helper utilities)
     - spacing-helpers.scss (Spacing helper utilities)
     - margins.scss (Margin utilities)
     - paddings.scss (Padding utilities)
     - center.scss (Centering utilities)
     - grouping.scss (Grouping utilities)
     - sorting.scss (Sorting utilities)
     - filtering.scss (Filtering utilities)
     - pagination.scss (Pagination utilities)
     - typography-helpers.scss (Typography helper utilities)
     - positioning.scss (Positioning helper utilities)
     - z-index.scss (Z-index helper utilities)
     - layering.scss (Layering helper utilities)
     - transforms.scss (Transform helper utilities)
     - animate.scss (Animation helper utilities)
     - smoothing.scss (Smoothing helper utilities)
     - shadows.scss (Shadow helper utilities)
     - borders.scss (Border helper utilities)
     - shapes.scss (Shape helper utilities)
     - compression.scss (Compression utilities)
     - optimizations.scss (Optimization utilities)
     - lcp.scss (Largest Contentful Paint utilities)
     - fcp.scss (First Contentful Paint utilities)
     - tti.scss (Time to Interactive utilities)
     - cls.scss (Cumulative Layout Shift utilities)
     - fie.scss (First Input Delay utilities)
     - mobile.scss (Mobile-specific utilities)
     - tablet.scss (Tablet-specific utilities)
     - desktop.scss (Desktop-specific utilities)

Conventions

- Keep each file scoped and small — prefer adding a new partial if a file
  grows large or covers multiple concerns.

- Reference variables (from `variables.scss`) only after that file is
  imported in `main.scss`.

- Use `--` CSS custom properties for theming tokens; prefer semantic names.

- Use Australian English for comments and any text (e.g. "organise").
- When a partial may be loaded more than once (via forwards/uses), prefer
  `//` Sass comments instead of `/*…*/` so the final build isn’t bloated with
  repeated header blocks.

Quick checklist for changes

- Keep `main.scss` as the single entrypoint; do not link partials from HTML.

- Document any structural change in this README briefly.
- Note (2026-01-25): Spacing utilities moved to `spacing.scss`, layout helpers moved to `layout.scss`, and base typographic rules moved to `typography.scss`. Additionally, `colours.scss`, `config.scss`, `media.scss`, and `sizing.scss` were populated with conservative helpers and tokens. Make small, reversible commits and run visual smoke tests when moving additional rules.
- Note (2026-01-26): Migrated base HTML typography to `partials/elements/html.scss`; moved global `font-feature-settings` to `partials/elements/all.scss`; moved heading font-feature settings to `partials/elements/headings.scss`; and moved basic link/button bases to `partials/elements/links.scss` and `partials/elements/buttons.scss`. Keep migrations small and verify appearance across `pages/*.html` and store/checkout flows.
- Note (2026-01-26): Added conservative element defaults for `body`, `p`, `ul/ol`, `img`, `table`, and `label` in `partials/elements/*`. These defaults are minimal and reversible — run visual/a11y smoke tests on store and checkout pages before merging larger changes.
- Note (2026-01-26): Migrated control padding/transition into `partials/elements/input.scss`; added input focus/disabled rules and button baseline/disabled rules in `partials/elements/buttons.scss`. Review forms and search controls for layout parity before merging.
- Note (2026-01-26): Moved `@media print` rules from `partials/categories.scss` to `partials/elements/all.scss` to centralise element print styles (a, abbr, pre, blockquote, tr, img, headings, etc.).
- Note (2026-01-26): Added visible keyboard focus styles for buttons in `partials/elements/buttons.scss` to improve keyboard navigation visibility and accessibility.
- Note (2026-01-26): Added Objects layer partials in `partials/objects/` and migrated layout-only rules into them: `.container` → `partials/objects/container.scss`, `.grid` → `partials/objects/grid.scss`, `.stack`/`.center-row` → `partials/objects/flexbox.scss`, `.responsive-media` → `partials/objects/media-object.scss`. Objects should remain undecorated and layout-focused; keep one-off utilities using the `u-` prefix. Before merging run visual/a11y smoke tests on `index.html`, `pages/store/*.html`, `cart.html`, and `checkout.html` to verify parity.

If you want a different split or a build pipeline (Sass/partials compilation),
open an issue so we can discuss the approach and testing steps.
