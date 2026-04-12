h12279
s 00035/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
// Module: product-helpers
// Small helper to apply Utilities to product gallery markup for improved CLS and responsive behavior
export function init(documentRoot = document) {
  if (!documentRoot || typeof documentRoot.querySelectorAll !== 'function') return;

  try {
    // Add reserve class to product gallery figures (support data attributes and legacy class)
    const figures = documentRoot.querySelectorAll('figure.product-gallery, [data-product-gallery]');
    figures.forEach((fig) => {
      if (!fig.classList.contains('u-reserve-square')) {
        fig.classList.add('u-reserve-square');
      }
    });

    // Ensure product images use object-fit cover for consistent display and to reduce layout shifts
    const imgs = documentRoot.querySelectorAll('img[data-product-image], img[itemprop="image"]');
    imgs.forEach((img) => {
      if (!img.classList.contains('u-img-cover')) {
        img.classList.add('u-img-cover');
      }
      // If width/height attributes are missing, set a default intrinsic size to help browsers reserve space
      if (!img.getAttribute('width') || !img.getAttribute('height')) {
        img.setAttribute('width', '300');
        img.setAttribute('height', '300');
      }
      // Ensure images using data-product-image are prepped for responsive loading
      if (img.dataset && img.dataset.productImage && !img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  } catch (err) {
    // Fail silently — this module is an enhancement only
    console.warn('product-helpers init error', err);
  }
}
E 1
