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
Last but definitely not least, we have the Utilities layer, also known as the Trumps layer. This is our final layer and it serves a very specific and crucial purpose in our ITCSS architecture.

The Utilities layer is all about helper or utility rules that are designed to make small tweaks to our Objects and Components layers. These rules can adjust and override existing styles when necessary. Think of it as our secret weapon for dealing with those pesky edge cases and one-off style needs.

In the Utilities layer, we might define helper classes such as .hide to hide an element, .text-center to center text, or .mt-1 to add a specific amount of top margin. These utilities can then be applied directly to HTML elements as needed, providing us with a powerful tool for quick and easy adjustments.

Iterate through assets/css/partials/stylesheets, refactor the migration of any classes in assets/css/partials/ stylesheets into appropiate stylesheets below for this modern progressive web app and ensure no duplications and conflicts for below utilities partials (following ITCSS):

     - utilities.css (General utility classes)
     - display.css (Display helper utilities)
     - visibility.css (Visibility utilities)
     - hide.css (Hide utilities)
     - show.css (Show utilities)
     - sizing-helpers.css (Sizing helper utilities)
     - spacing-helpers.css (Spacing helper utilities)
     - margins.css (Margin utilities)
     - paddings.css (Padding utilities)
     - center.css (Centering utilities)
     - grouping.css (Grouping utilities)
     - sorting.css (Sorting utilities)
     - filtering.css (Filtering utilities)
     - pagination.css (Pagination utilities)
     - typography-helpers.css (Typography helper utilities)
     - positioning.css (Positioning helper utilities)
     - z-index.css (Z-index helper utilities)
     - layering.css (Layering helper utilities)
     - transforms.css (Transform helper utilities)
     - animate.css (Animation helper utilities)
     - smoothing.css (Smoothing helper utilities)
     - shadows.css (Shadow helper utilities)
     - borders.css (Border helper utilities)
     - shapes.css (Shape helper utilities)
     - compression.css (Compression utilities)
     - optimizations.css (Optimization utilities)
     - lcp.css (Largest Contentful Paint utilities)
     - fcp.css (First Contentful Paint utilities)
     - tti.css (Time to Interactive utilities)
     - cls.css (Cumulative Layout Shift utilities)
     - fie.css (First Input Delay utilities)
     - mobile.css (Mobile-specific utilities)
     - tablet.css (Tablet-specific utilities)
     - desktop.css (Desktop-specific utilities)

---
Last but definitely not least, we have the Utilities layer, also known as the Trumps layer. This is our final layer and it serves a very specific and crucial purpose in our ITCSS architecture.

The Utilities layer is all about helper or utility rules that are designed to make small tweaks to our Objects and Components layers. These rules can adjust and override existing styles when necessary. Think of it as our secret weapon for dealing with those pesky edge cases and one-off style needs.

In the Utilities layer, we might define helper classes such as .hide to hide an element, .text-center to center text, or .mt-1 to add a specific amount of top margin. These utilities can then be applied directly to HTML elements as needed, providing us with a powerful tool for quick and easy adjustments.

check entire codebase (html and js files) add new classes (create content in empty files) and modify existing classes to modernise and enhance the progressive web app as a html-first static mobile -first progressive web app ecommerce store enhancing the utilities partials (following ITCSS):

     - utilities.css (General utility classes)
     - display.css (Display helper utilities)
     - visibility.css (Visibility utilities)
     - hide.css (Hide utilities)
     - show.css (Show utilities)
     - sizing-helpers.css (Sizing helper utilities)
     - spacing-helpers.css (Spacing helper utilities)
     - margins.css (Margin utilities)
     - paddings.css (Padding utilities)
     - center.css (Centering utilities)
     - grouping.css (Grouping utilities)
     - sorting.css (Sorting utilities)
     - filtering.css (Filtering utilities)
     - pagination.css (Pagination utilities)
     - typography-helpers.css (Typography helper utilities)
     - positioning.css (Positioning helper utilities)
     - z-index.css (Z-index helper utilities)
     - layering.css (Layering helper utilities)
     - transforms.css (Transform helper utilities)
     - animate.css (Animation helper utilities)
     - smoothing.css (Smoothing helper utilities)
     - shadows.css (Shadow helper utilities)
     - borders.css (Border helper utilities)
     - shapes.css (Shape helper utilities)
     - compression.css (Compression utilities)
     - optimizations.css (Optimization utilities)
     - lcp.css (Largest Contentful Paint utilities)
     - fcp.css (First Contentful Paint utilities)
     - tti.css (Time to Interactive utilities)
     - cls.css (Cumulative Layout Shift utilities)
     - fie.css (First Input Delay utilities)
     - mobile.css (Mobile-specific utilities)
     - tablet.css (Tablet-specific utilities)
     - desktop.css (Desktop-specific utilities)

https://benmarshall.me/itcss/#elements
https://github.com/aarongarciah/itcss-sample/tree/master/src/scss/04-elements

