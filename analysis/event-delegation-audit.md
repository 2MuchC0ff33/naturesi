# Batch 10 — Event Delegation & Global Listeners Audit

Scope
- Scanned: `assets/js/modules/*` and top-level service worker files for global `addEventListener` usage and common delegation patterns.

Findings (summary)
- Document-level delegation is used intentionally in several modules to keep markup simple and enable HTML-first fallbacks. Key places:
  - `assets/js/modules/cart-init.js`: `document.addEventListener('submit', ...)` and `document.addEventListener('click', ...)` to capture add-to-cart and related interactions.
  - `assets/js/modules/modal.js`: `document.addEventListener('keydown', onKey)` and `document.addEventListener('click', ...)` for global modal keyboard/overlay handling.
  - `assets/js/modules/nav-toggle.js`: registers `document.addEventListener('keydown', ...)` and `document.addEventListener('click', ...)` for global escape/close behaviour and off-click handling.
  - `assets/js/modules/cartUI.js` and `cart.js`: attach `DOMContentLoaded` and element-specific `submit`/`click` listeners.
  - `assets/js/modules/checkout-bootstrap.js`: attaches small click handler to `pay-now-redirect`.
  - `assets/js/modules/sw-register.js` / `sw-*`: service worker global listeners (`load`, `controllerchange`, `updatefound`, `install`, `message`, `fetch`, `sync`). These should remain in place.

Potential issues and risk
- Listener duplication: multiple modules each attach `keydown`/`click` handlers at document scope (modal + nav + others). This can lead to multiple handlers running for the same key/click event and make focus/escape behaviour brittle.
- Order-of-registration sensitivity: because modules are asynchronously imported in `assets/js/app.js`, the sequence of listener registration may vary across pages and environments, which affects which handler sees events first.
- Memory/leak risk: some modules attach global listeners without explicit removal if the component is torn down. `modal.js` removes listener via stored reference when closing a modal — good pattern to follow elsewhere where appropriate.

Conservative consolidation recommendations (minimal, safe)
1. Keep per-component init functions responsible for registering their own delegated listeners, but adopt a shared utility for common patterns:
   - Add `assets/js/modules/event-delegation.js` exporting helpers:
     - `delegate(container=document, event, selector, handler)` — attaches a single handler to `container` that checks `event.target.closest(selector)`.
     - `onKeyOnce(handler)` / `onKeyMap(mapping)` — small helpers for standardized key handling (Escape -> close, Arrow keys -> navigate), returning a remover function.
   - Replace ad-hoc `document.addEventListener('click', ...)` with `delegate(document, 'click', '[data-some-hook]', handler)` where appropriate.

2. Standardize Escape handling:
   - Use a single `onKeyMap` helper across `modal.js` and `nav-toggle.js` so Escape behaviour is consistent and easy to override by components.
   - Ensure handlers check `event.defaultPrevented` and `event.target.isContentEditable` before acting.

3. Explicit attach/detach for dynamic UI:
   - Modules that open transient UI (modals, mobile nav) must register their document-level listeners when opened and remove them on close. `modal.js` already does this; mirror the pattern in `nav-toggle.js` (if not present) and any other transient component.

4. Namespace CustomEvents and avoid global collisions:
   - Use event names like `naturesi:cart:updated` or `naturesi:modal:open` to avoid clashing with other scripts.

Accessibility & focus management notes
- Roving tabindex: current code uses roving tabindex in some components (nav-toggle inserts a toggle and handles focus). Recommend central helper for roving tabindex in `event-delegation.js` or `a11y-helpers.js`.
- Focus restoration: ensure all transient components save the previously focused element before opening and restore focus on close. `modal.js` already saves/restores; audit others (nav toggle, off-canvas) and apply same pattern.

Testing & rollout plan (safe, reversible)
1. Implement `event-delegation.js` with the delegate and key helpers (non-breaking). Update one consumer (e.g., `modal.js`) to use the helper and verify behaviour.
2. Run manual QA checklist: add-to-cart, cart page submission, nav open/close via keyboard, modal open/close via click and ESC, PayPal redirect population. Use `analysis/cart-qa-checklist.md` as scaffold.
3. If tests pass, progressively migrate other modules to use the helpers in small PRs (one module per PR) to reduce risk.

Next actionable options I can perform now
- A) Implement `assets/js/modules/event-delegation.js` helpers and migrate `modal.js` and `nav-toggle.js` to use them (small, low-risk change).
- B) Implement the helper module only and update documentation/analysis for stepwise migration.
- C) Run targeted runtime smoke checks (fetch pages and run simple DOM presence checks) to validate no regressions after earlier checkout changes.

Conclusion
- The codebase already uses delegation sensibly in key areas (cart-init), but `keydown`/`click` handlers are duplicated across modules. Introducing a tiny helper module and standardizing Escape handling and focus-restoration will reduce brittleness and make future selector modernisation safer.
