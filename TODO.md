# TODO List

Run these commands in order:

- [ ] npm doctor - Check Node.js environment and npm setup for issues.
- [ ] npm audit - Scan dependencies for security vulnerabilities.
- [ ] prettier - Format code consistently (run before linting to avoid conflicts).
- [ ] htmlhint - Lint HTML files for syntax and best practices.
- [ ] stylelint - Lint CSS for style issues and consistency.
- [ ] Perform janitorial tasks on any codebase including cleanup, simplification, and tech debt remediation
- [ ] eslint - Lint JavaScript for code quality and errors.
- [ ] typescript compiler (tsc) - Type-check if using TypeScript (skip if pure vanilla JS).
- [ ] vitest - Run unit tests for JavaScript modules.
- [ ] vitest --coverage - Generate code coverage reports for unit tests (using @vitest/coverage-v8).
- [ ] stryker - Perform mutation testing on unit tests (requires vitest results).
- [ ] playwright - Run end-to-end tests for UI interactions.
- [ ] axe-playwright - Run accessibility audits on Playwright tests (integrates with axe-core).
- [ ] jest-image-snapshot - Capture and compare visual snapshots for UI regression testing (use with Playwright or separately).
- [ ] pa11y - Perform standalone accessibility testing on pages (alternative/complement to axe).
- [ ] lighthouse - Audit performance, accessibility, and SEO on the site.

Run `[tool]` across entire codebase and if any issues, debug, iterate until fixed and resolved without interrupting the user
