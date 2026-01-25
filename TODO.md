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

Tha above partials are part of the tools group in ITCSS and that is their purpose.

Iterate through assets/css/partials/stylesheets, refactor the migration of any classes in assets/css/partials/ stylesheets into appropiate stylesheets below for this modern progressive web app and ensure no duplications and conflicts for below tools partials (following ITCSS):

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

---

check entire codebase (html and js files) add any new classes (create content in empty files) to modernise the progressive web app as an ecommerce store enhancing the generic partials (following ITCSS):

     - reset.css (Style resets)
     - unstyle.css (Unstyled base elements)
     - normalize.css (Normalization styles)
     - sanitize.css (Sanitization styles)
     - base.css (Base document styles)
     - selections.css (Text selection styles)

     and also decide whether there are too aggressive classes, duplicates and conflicts or classes are better to reside in the settings group of ITCSS below

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

          and or the tools group of ITCSS below

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

https://benmarshall.me/itcss/#elements
https://github.com/aarongarciah/itcss-sample/tree/master/src/scss/04-elements
