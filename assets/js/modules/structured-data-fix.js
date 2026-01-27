(function(){
  // Ensure JSON-LD SearchAction uses required name=q
  const nodes = document.querySelectorAll('script[type="application/ld+json"]');
  nodes.forEach(n => {
    try {
      const data = JSON.parse(n.textContent || '{}');
      if (data['@type'] === 'WebSite' && data.potentialAction && data.potentialAction['@type'] === 'SearchAction'){
        if (!data.potentialAction.queryInput || !/name=q/.test(String(data.potentialAction.queryInput))) {
          data.potentialAction.queryInput = 'required name=q';
          n.textContent = JSON.stringify(data);
        }
        if (!data.potentialAction.target || !/search\.html\?q=\{search_term_string\}/.test(String(data.potentialAction.target))) {
          data.potentialAction.target = '/search.html?q={search_term_string}';
          n.textContent = JSON.stringify(data);
        }
      }
    } catch(_){ }
  });
})();
