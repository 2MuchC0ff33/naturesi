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

### Helper mixins

`partials/utilities/helpers.scss` contains frequently used helper mixins
that rely on the token maps from `partials/settings/_maps.scss`.  Common
patterns include:

```scss
@use "../settings/maps" as maps;
@use "utilities/helpers" as helpers;

.my-component {
  @include helpers.fluid-type();          /* responsive font-size */
  @include helpers.bg-color(accent);      /* background from colour map */
  @include helpers.grid(3, maps.spacing(md));
  @include helpers.box-shadow(md);
}
```

New code should favour these helpers or direct map lookups rather than
hard‑coding `var(--foo)` tokens.  As existing partials are touched, convert
manual CSS rules (borders, colours, layouts) to use maps and helpers; the
build step flags any remaining `var(--` occurrences so they can be cleaned
up.

Once all tokens live in maps the `variables.scss` shim can be removed and
styles will be driven entirely from Sass data structures.

