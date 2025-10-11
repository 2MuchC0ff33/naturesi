---
description: "Implement a shopping cart using semantic HTML5, CSS, and native browser APIs with minimal JavaScript, ensuring performance, accessibility, and offline support."
mode: "agent"
tools: ["search/codebase", "edit/editFiles", "search", "upstash/context7/*", "sequentialthinking/*", "microsoftdocs/mcp/*", "fetch"]
---

### 🧩 Task

You are an expert web developer focused on building lightweight, accessible, and performant web applications using semantic HTML5, CSS, and native browser APIs. Your goal is to implement a shopping cart for a static e-commerce website with minimal JavaScript, relying primarily on built-in browser capabilities.

#### 🛒 Shopping Cart Requirements

1. **Product Selection**  
   Users can browse products on `pages/store/*.html` and select packaging size and quantity using native form elements.

2. **Cart State Persistence**  
   Persist cart data across sessions and page reloads using native APIs:  
   - `localStorage`  
   - `sessionStorage`  
   - `IndexedDB`  
   - `document.cookie`

3. **Cart Page Functionality**  
   On `cart.html`, users can view, modify, and remove items using accessible form controls and semantic markup.

4. **Cart Icon Updates**  
   Reflect the current item count dynamically in the header using declarative HTML elements such as:  
   - `<output>`  
   - `<meter>`  
   - `<progress>`  
   - `<data>`

5. **Offline Support**  
   Integrate with `service-worker.js` to ensure cart functionality persists offline and syncs when back online using:  
   - `CacheStorage`  
   - `FetchEvent`  
   - `Background Sync`  
   - `navigator.onLine`

6. **Accessibility**  
   Ensure all cart-related elements are accessible via keyboard and screen readers using semantic HTML and ARIA roles.

7. **Page Coverage**  
   Cart state must persist across all pages except: `offline.html`, `404.html`, `yandex_7847a6427bfa1388.html`, and `google-site-verification.html`.

8. **Performance and Maintainability**  
   Avoid custom JS modules unless necessary. Use native APIs and declarative HTML to reduce script size and complexity.

---

### 📘 Instructions

#### 1. HTML Updates
- Use semantic HTML5 elements to structure all cart-related content across `index.html`, `pages/*.html`, and `pages/store/*.html`.
- Implement product selection using native form controls (`<select>`, `<input type="number">`, `<button>`).
- Use `data-*` attributes to store product metadata for cart operations.
- Ensure the cart icon in the header reflects item count using declarative HTML (`<output>`, `<meter>`, `<progress>`, `<data>`).
- Ensure all interactive elements are accessible via keyboard and screen readers using ARIA roles and proper labelling.
- Exclude cart functionality from `offline.html`, `404.html`, `yandex_7847a6427bfa1388.html`, and `google-site-verification.html`.

#### 2. CSS Updates
- Use partial stylesheets in `assets/css/partials/*.css` to style cart components.
- Apply mobile-first responsive design principles.
- Use CSS variables for consistent theming.
- Implement hover/focus states and transitions using CSS only.
- Ensure accessibility through visual contrast and readable typography.
- Avoid JS-based animations; use CSS keyframes and transitions.

#### 3. JavaScript Usage
- Minimise JavaScript by relying on native browser APIs:
  - `localStorage`, `sessionStorage`, `IndexedDB`, `document.cookie` for cart persistence.
  - `FormData` for form handling.
  - `CustomEvent`, `EventTarget`, `addEventListener` for lightweight event communication.
  - `querySelector`, `dataset`, `classList`, `closest`, `matches` for DOM interaction.
- Avoid creating separate JS modules unless necessary.
- Centralise minimal JS logic in `app.js` for cart state management and UI updates.
- Ensure all JS is progressive and enhances functionality without breaking core features.

#### 4. Service Worker Integration
- Update `service-worker.js` to cache cart-related assets and pages.
- Ensure offline functionality using:
  - `CacheStorage`
  - `FetchEvent`
  - `Background Sync`
  - `navigator.onLine`
- Handle offline changes gracefully and sync with server when reconnected.

#### 5. Accessibility
- Use semantic HTML and ARIA roles to ensure screen reader compatibility.
- Ensure all form elements are labelled and keyboard-accessible.
- Implement skip links and focus management using native HTML features.
- Avoid JS-based accessibility enhancements unless absolutely necessary.

#### 6. Testing
- Validate cart functionality across all supported pages.
- Test persistence using browser dev tools (Storage tab).
- Simulate offline scenarios to verify service worker behaviour.
- Use tools like Lighthouse or Axe to audit accessibility and performance.

---

### 📦 Output

- A fully functional shopping cart integrated into the static website using:
  - Semantic HTML5 elements for structure and accessibility.
  - Native browser APIs for cart state management:
    - `localStorage`, `sessionStorage`, `IndexedDB`, `document.cookie`
    - `FormData`, `CustomEvent`, `EventTarget`
    - `CacheStorage`, `FetchEvent`, `Background Sync`, `navigator.onLine`
  - Minimal JavaScript, centralised in `app.js`, only where enhancement is necessary.
  - Offline support via `service-worker.js` using native caching and sync strategies.
  - Accessible markup with ARIA roles, labelled form controls, and keyboard navigation.

- Updated HTML files:
  - `index.html`, `pages/store/*.html`, `pages/*.html`, and `cart.html` with cart-related markup and form elements.
  - Exclude updates to `offline.html`, `404.html`, `yandex_7847a6427bfa1388.html`, and `google-site-verification.html`.

- Updated CSS partials in `assets/css/partials/` for styling cart components, ensuring responsive and accessible design.

- Updated `service-worker.js` to support offline cart functionality and sync behaviour.

- Minimal updates to `assets/js/app.js` to handle cart logic using native APIs.

- All changes documented clearly in code comments and commit messages, following project conventions.

---

### ✅ Quality/Validation

#### 🔍 Validation Criteria

- **Functionality**
  - Verify that the shopping cart works consistently across all supported pages.
  - Confirm that cart state persists across page reloads and browser sessions using native APIs.
  - Ensure cart updates (add, modify, delete) reflect immediately in the UI with minimal JS.

- **Offline Support**
  - Test offline scenarios using browser dev tools and confirm cart functionality remains intact.
  - Validate that `service-worker.js` correctly caches cart assets and syncs changes when back online.

- **Accessibility**
  - Use tools like **Lighthouse**, **Axe**, or **NVDA** to audit accessibility.
  - Confirm all interactive elements are keyboard-accessible and screen reader-friendly.
  - Validate ARIA roles, labels, and semantic structure.

- **Performance**
  - Audit page load and interaction performance using browser profiling tools.
  - Ensure minimal JavaScript footprint and efficient use of native APIs.
  - Confirm that CSS transitions and layout are optimised for responsiveness and low reflow.

- **Cross-Browser Compatibility**
  - Test cart functionality on modern browsers (Chrome, Firefox, Safari, Edge).
  - Ensure graceful degradation on older browsers where native APIs may be limited.

- **Code Quality**
  - Validate HTML, CSS, and JavaScript using linters and validators.
  - Ensure code is clean, modular, and well-commented.
  - Follow project conventions and document all changes in commit messages.