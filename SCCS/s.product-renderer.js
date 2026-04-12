h18632
s 00028/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
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
E 1
