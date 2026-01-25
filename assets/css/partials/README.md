# CSS partials — organisation and guidance

This folder contains modular CSS partials imported by `../main.css`.

Purpose

- Keep the single `main.css` entrypoint while splitting implementation into
  small, focused files so changes are easier to review and maintain.

Import order (important)

1. `variables.css` — design tokens and CSS custom properties
2. `reset.css` — low-level reset and media-element rules
3. `base.css` — global typography and base element rules
4. `forms.css` — inputs, buttons and form controls
5. `accessibility.css` — focus outlines, skip links and helpers
6. `utilities.css` — small utilities and helper classes
7. `header.css` — header, nav and branding styles
8. `nav-extras.css` — nav dropdowns, icons and related rules
9. `footer.css` — footer layout and legal bar
10. `categories-theme.css` — category dropdowns, theme and print rules
11. `components.css` — small repeated components and variants
12. `cart.css` — cart component styles
13. `checkout.css` — checkout styles

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

If you want a different split or a build pipeline (Sass/partials compilation),
open an issue so we can discuss the approach and testing steps.
