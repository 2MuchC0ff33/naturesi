# CSS Style Guide

## Comment Syntax Requirement

All CSS files in this project must use standard CSS block comments only:

    /* This is a valid CSS comment */

Do **not** use JavaScript-style `//` comments in any CSS file. This ensures compatibility with all CSS parsers and minifiers.

- Use `/* ... */` for all comments, including inline and documentation comments.
- Remove or convert any `//` comments found in CSS files.

This rule is mandatory for all contributors. PRs with `//` comments in CSS will not be accepted.
