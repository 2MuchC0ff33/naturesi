/* product-renderer.js — simplified: only option price handlers remain (product grids are static HTML) */
(function () {
  function attachOptionHandlers(container) {
    container.querySelectorAll('input[type="radio"][data-price]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var article = radio.closest('article');
        if (!article) return;
        var price = radio.dataset.price;
        var btn = article.querySelector('button[type="submit"]');
        if (btn) {
          btn.textContent = price ? 'Add to Cart \u2014 $' + Number(price).toFixed(2) : 'Add to Cart';
        }
      });
    });
  }

  function init() {
    document.querySelectorAll('.product-grid').forEach(function (grid) {
      attachOptionHandlers(grid);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
