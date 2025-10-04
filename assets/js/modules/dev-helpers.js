// Module: Development helpers
// Purpose: keeps small development-only helpers in one place for easier toggling or removal
export function initDevHelpers() {
  if (window.location.hostname === 'localhost') {
    // Force reload on focus for development
    window.addEventListener('focus', () => {
      /* eslint-disable no-console */
      console.log('Window focused - Development mode active');
      /* eslint-enable no-console */
      // reload to provide a very simple live-reload experience in dev
      location.reload();
    });

    // Add timestamp to help identify fresh loads
    /* eslint-disable no-console */
    console.log('Page loaded at:', new Date().toISOString());
    /* eslint-enable no-console */
  }
}
