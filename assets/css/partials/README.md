# CSS partials — organisation and guidance

This folder contains modular CSS partials imported by `../main.css`.

Purpose

- Keep the single `main.css` entrypoint while splitting implementation into
  small, focused files so changes are easier to review and maintain.

Import order (important)

1. `01-variables.css` — design tokens and CSS custom properties
2. `02-reset.css` — low-level reset and media-element rules
3. `03-base.css` — global typography and base element rules
4. `04-forms.css` — inputs, buttons and form controls
5. `05-accessibility.css` — focus outlines, skip links and helpers
6. `06-utilities.css` — small utilities and helper classes
7. `07-header.css` — header, nav and branding styles
8. `08-nav-extras.css` — nav dropdowns, icons and related rules
9. `09-footer.css` — footer layout and legal bar
10. `10-categories-theme.css` — category dropdowns, theme and print rules
11. `11-components.css` — small repeated components and variants

Conventions

- Keep each file scoped and small — prefer adding a new partial if a file
  grows large or covers multiple concerns.

- Reference variables (from `01-variables.css`) only after that file is
  imported in `main.css`.

- Use `--` CSS custom properties for theming tokens; prefer semantic names.

- Use Australian English for comments and any text (e.g. "organise").

Quick checklist for changes

- Run `npx stylelint "assets/css/**/*.css"` (project task included) and fix
  any warnings/errors before committing.

- Keep `main.css` as the single entrypoint; do not link partials from HTML.

- Document any structural change in this README briefly.

If you want a different split or a build pipeline (Sass/partials compilation),
open an issue so we can discuss the approach and testing steps.
