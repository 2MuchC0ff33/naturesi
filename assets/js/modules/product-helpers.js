// Module: product-helpers
// Small helper to apply Utilities to product gallery markup for improved CLS and responsive behavior
export function init(documentRoot = document) {
  if (!documentRoot || typeof documentRoot.querySelectorAll !== 'function') return;

  try {
    // Add reserve class to product gallery figures (if not present)
    const figures = documentRoot.querySelectorAll('figure.product-gallery');
    figures.forEach((fig) => {
      if (!fig.classList.contains('u-reserve-square')) {
        fig.classList.add('u-reserve-square');
      }
    });

    // Ensure product images use object-fit cover for consistent display and to reduce layout shifts
    const imgs = documentRoot.querySelectorAll('img[itemprop="image"]');
    imgs.forEach((img) => {
      if (!img.classList.contains('u-img-cover')) {
        img.classList.add('u-img-cover');
      }
      // If width/height attributes are missing, set a default intrinsic size to help browsers reserve space
      if (!img.getAttribute('width') || !img.getAttribute('height')) {
        img.setAttribute('width', '300');
        img.setAttribute('height', '300');
      }
    });
  } catch (err) {
    // Fail silently — this module is an enhancement only
    console.warn('product-helpers init error', err);
  }
}
