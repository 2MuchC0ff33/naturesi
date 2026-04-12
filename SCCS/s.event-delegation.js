h45130
s 00036/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
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
E 1
