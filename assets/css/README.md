# CSS Style Guide

## Comment Syntax Requirement

All CSS files in this project must use standard CSS block comments only:

    /* This is a valid CSS comment */

Do **not** use JavaScript-style `//` comments in any CSS file. This ensures compatibility with all CSS parsers and minifiers.

- Use `/* ... */` for all comments, including inline and documentation comments.
- Remove or convert any `//` comments found in CSS files.

This rule is mandatory for all contributors. PRs with `//` comments in CSS will not be accepted.

## Sass module migration

The project is transitioning from legacy `@import` to the newer module system
(`@use`/`@forward`).  A set of aggregator partials (`_settings.scss`,
`_tools.scss`, etc.) lives in `assets/css/partials/` and are pulled in from
`main.scss` with a handful of `@use` statements.  Each aggregator forwards the
original partials in the established order; during the migration individual
files will be rewritten to use `@use`/`@forward` themselves.

*New partials should always be authored as modules.*  Existing files may still
contain `@import` temporarily, but contributors should avoid adding new
imports and instead place their file under an appropriate aggregator.

Vendor stylesheets (third‑party CSS that cannot be referenced via Sass)
should be isolated in `partials/vendors/` and pulled in through the
`_vendors.scss` aggregator.  This makes it easy to review external
dependencies and ultimately remove the need for `postcss-import`.

