// Small event delegation and key helper utilities
export function delegate(container = document, eventType, selector, handler) {
  if (!container || !container.addEventListener) return () => {};
  const listener = (e) => {
    try {
      const match = e.target && e.target.closest ? e.target.closest(selector) : null;
      if (!match) return;
      handler.call(match, e, match);
    } catch (err) {
      // swallow errors to avoid breaking other handlers
      console.error('delegate handler error', err);
    }
  };
  container.addEventListener(eventType, listener);
  return function remove() {
    container.removeEventListener(eventType, listener);
  };
}

// Add a simple keydown map helper. Returns a remover function.
export function addKeyListener(container = document, map = {}) {
  if (!container || !container.addEventListener) return () => {};
  const listener = (e) => {
    try {
      if (e && e.key && map[e.key]) {
        map[e.key](e);
      }
    } catch (err) {
      console.error('addKeyListener handler error', err);
    }
  };
  container.addEventListener('keydown', listener);
  return function remove() {
    container.removeEventListener('keydown', listener);
  };
}
