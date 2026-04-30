export function init(documentRoot = document) {
  if (!documentRoot || typeof documentRoot.querySelectorAll !== 'function') return;

  try {
    const defaultImageDimension = '300';
    const figures = documentRoot.querySelectorAll('figure.product-gallery, [data-product-gallery]');
    figures.forEach((fig) => {
      if (!fig.classList.contains('u-reserve-square')) {
        fig.classList.add('u-reserve-square');
      }
    });

    const imgs = documentRoot.querySelectorAll('img[data-product-image], img[itemprop="image"]');
    imgs.forEach((img) => {
      if (!img.getAttribute('width') || !img.getAttribute('height')) {
        img.setAttribute('width', defaultImageDimension);
        img.setAttribute('height', defaultImageDimension);
      }
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  } catch (err) {
    console.warn('product-helpers init error', err);
  }
}
