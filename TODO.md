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
The fifth layer in our ITCSS structure is the Objects layer. This is where our website starts to take shape. This layer houses the style rules for elements that are responsible for the layout or structuring of our page.

In the Objects layer, we create style rules for class-based selectors that define undecorated design patterns. These aren’t tied to any specific component but serve as the backbone of many components.

Think of these as the building blocks that we will use to construct our website. They are like the Lego pieces that we can use and reuse to build various sections of our site.

Iterate through assets/css/partials/stylesheets, refactor the migration of any classes in assets/css/partials/ stylesheets into appropiate stylesheets below for this modern progressive web app and ensure no duplications and conflicts for below objects partials (following ITCSS):

But remember, the key here is to keep these styles undecorated and general enough to be reusable across different components. We’re creating a toolbox of classes that can be used to build out more complex components in the following layers of our ITCSS architecture​.
---
Next up on our ITCSS adventure is the Elements layer, a key player in the process. Think of this layer as the interior decorator of our CSS house. It’s where we add a touch of personality to the bare HTML elements, like h1, button, and so on.

In this layer, we provide default styling for these basic HTML elements. These styles are not tied to any specific classes or ids, they are universally applied to these elements across your entire project.

check entire codebase (html and js files) add new classes (create content in empty files) and modify existing classes to modernise and enhance the progressive web app as a html-first static ecommerce store enhancing the elements partials (following ITCSS):

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

https://benmarshall.me/itcss/#elements
https://github.com/aarongarciah/itcss-sample/tree/master/src/scss/04-elements

