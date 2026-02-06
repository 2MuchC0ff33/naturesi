async function loadStructuredData() {
  try {
    const [org, website, breadcrumb] = await Promise.all([
      fetch('/assets/js/data/structured-data-org.json').then(r => r.json()),
      fetch('/assets/js/data/structured-data-website.json').then(r => r.json()),
      fetch('/assets/js/data/structured-data-breadcrumb.json').then(r => r.json())
    ]);

    const insertScript = (data) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    };

    insertScript(org);
    insertScript(website);
    insertScript(breadcrumb);
  } catch (e) {
    console.warn('Failed to load structured data', e);
  }
}

loadStructuredData();
