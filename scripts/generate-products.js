// scripts/generate-products.js
// Node script to extract products (id, sku, name, variants/prices) from pages/store/*.html
// and merge with existing products.json to produce products.generated.json for review.

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_DIR = path.join(__dirname, '..', 'pages', 'store');
const PRODUCTS_JSON = path.join(__dirname, '..', 'assets', 'js', 'data', 'products.json');
const OUTPUT = path.join(__dirname, '..', 'assets', 'js', 'data', 'products.generated.json');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function readFiles() {
  const files = await fs.readdir(STORE_DIR);
  return files.filter(f => f.endsWith('.html')).map(f => path.join(STORE_DIR, f));
}

function extractArticleBlocks(html) {
  const blocks = [];
  const regex = /<article[\s\S]*?<\/article>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const block = m[0];
    if (/class="[^"]*product[^"]*"/i.test(block)) {
      blocks.push(block);
    }
  }
  return blocks;
}

function extractField(block, attr) {
  const re = new RegExp(attr + "=[\"']([^\"']+)[\"']", 'i');
  const m = block.match(re);
  return m ? m[1] : null;
}

function extractName(block) {
  const m = block.match(/<h3[^>]*itemprop=["']name["'][^>]*>([\s\S]*?)<\/h3>/i);
  if (m) return m[1].replace(/<[^>]+>/g, '').trim();
  return null;
}

function extractImages(block) {
  const imgs = [];
  const re = /<img[^>]*itemprop=["']image["'][^>]*src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(block)) !== null) imgs.push(m[1]);
  // fallback to data-image on article
  if (imgs.length === 0) {
    const dataImage = extractField(block, 'data-image');
    if (dataImage) imgs.push(dataImage.replace(/^\//, '/'));
  }
  return imgs;
}

function extractDescription(block) {
  const m = block.match(/<section[^>]*class="product-description"[^>]*>([\s\S]*?)<\/section>/i);
  if (m) return m[1].replace(/<[^>]+>/g, ' ').trim().replace(/\s+/g, ' ').trim();
  return '';
}

function extractWeightFromLabel(label) {
  if (!label) return null;
  // match "60 g", "60g", "60 grams", "0.06 kg", "100kg" etc.
  const m = label.match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|g|grams|gram|kilograms|kilogram)\b/i);
  if (!m) return null;
  let val = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (/kg|kilogram/.test(unit)) {
    // convert to grams for consistency
    val = Math.round(val * 1000);
    return `${val} g`;
  }
  // grams - return integer grams if possible
  const grams = Math.round(val);
  return `${grams} g`;
}

// Heuristic: find price->weight pairs inside a block/region by proximity
function findPriceWeightMap(text) {
  const map = {};
  if (!text) return map;
  try {
    // pattern: price then weight (up to 120 chars between)
    const re1 = /(?:\$?([0-9]+(?:\.[0-9]{1,2})?))[^<]{0,120}?([0-9]+(?:\.[0-9]+)?)\s*(kg|g|grams|gram|kilograms|kilogram)\b/gi;
    let m;
    while ((m = re1.exec(text)) !== null) {
      const price = Number(m[1]);
      const weight = extractWeightFromLabel(m[2] + ' ' + m[3]);
      if (price && weight) map[price] = weight;
    }
    // reverse: weight then price
    const re2 = /([0-9]+(?:\.[0-9]+)?)\s*(kg|g|grams|gram|kilograms|kilogram)[^<]{0,120}?\$?([0-9]+(?:\.[0-9]{1,2})?)/gi;
    while ((m = re2.exec(text)) !== null) {
      const weight = extractWeightFromLabel(m[1] + ' ' + m[2]);
      const price = Number(m[3]);
      if (price && weight) map[price] = weight;
    }
    // also detect constructions like "$14.00 - 60 g" or "60 g ($14.00)"
    const re3 = /\$?([0-9]+(?:\.[0-9]{1,2})?)\s*[-–—]\s*([0-9]+(?:\.[0-9]+)?)\s*(kg|g|grams|gram)/gi;
    while ((m = re3.exec(text)) !== null) {
      const price = Number(m[1]);
      const weight = extractWeightFromLabel(m[2] + ' ' + m[3]);
      if (price && weight) map[price] = weight;
    }
  } catch (e) {
    // ignore
  }
  return map;
}

function extractAvailability(block) {
  const m2 = block.match(/<div[^>]*class="availability"[^>]*>([\s\S]*?)<\/div>/i);
  if (m2) {
    // prefer textual indication (Out of Stock) over link when both exist
    if (/Out of Stock/i.test(m2[1])) return false;
    const m = m2[1].match(/<link[^>]*itemprop=["']availability["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    if (m) return /InStock/i.test(m[1]);
    return true;
  }
  // fallback: check for link anywhere in block
  const m = block.match(/<link[^>]*itemprop=["']availability["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (m) return /InStock/i.test(m[1]);

  return true; // assume in stock when unknown
}

function extractVariants(block, pageHtml, productId) {
  const variants = [];
  // try inputs inside the block first
  const re = /<label>[\s\S]*?<input[^>]*?(?:data-price|content)\s*=\s*["']?([0-9]+(?:\.[0-9]+)?)["']?[^>]*value=["']?([^"'>\s]*)[^>]*>[^<]*<\/label>/gi;
  let m;
  while ((m = re.exec(block)) !== null) {
    const price = parseFloat(m[1]);
    const value = m[2] || null;
    const labelMatch = (/label>\s*([\s\S]*?)<\//i).exec(m[0]);
    const labelText = labelMatch ? labelMatch[1].replace(/<[^>]+>/g, '').trim() : null;
    variants.push({ id: value || slugify(labelText || 'variant'), label: labelText || (value || 'variant'), price });
  }

  // fallback: raw inputs with data-price anywhere inside the block
  const re2 = /<input[^>]*?(?:data-price|content)\s*=\s*["']?([0-9]+(?:\.[0-9]+)?)["']?[^>]*>/gi;
  while ((m = re2.exec(block)) !== null) {
    const price = parseFloat(m[1]);
    variants.push({ id: 'variant-' + variants.length, label: null, price });
  }

  // If none found in the article, try to find a package-options container elsewhere on the page
  if (variants.length === 0 && pageHtml && productId) {
    const labelId = `package-label-${productId}`;
    // find element that references this id via aria-labelledby
    const containerRe = new RegExp(`<[^>]+aria-labelledby=["']${labelId}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
    const c = pageHtml.match(containerRe);
    if (c && c[1]) {
      const container = c[1];
      const re3 = /<input[^>]*?(?:data-price|content)\s*=\s*["']?([0-9]+(?:\.[0-9]+)?)["']?[^>]*value=["']?([^"'>\s]*)[^>]*>/gi;
      while ((m = re3.exec(container)) !== null) {
        const price = parseFloat(m[1]);
        const value = m[2] || null;
        const labelMatch = (/label>\s*([\s\S]*?)<\//i).exec(m[0]);
        const labelText = labelMatch ? labelMatch[1].replace(/<[^>]+>/g, '').trim() : null;
        variants.push({ id: value || slugify(labelText || 'variant'), label: labelText || (value || 'variant'), price });
      }
      // also fallback to any data-price inside that container
      if (variants.length === 0) {
        const re4 = /data-price=["']?([0-9]+(?:\.[0-9]+)?)["']?/gi;
        while ((m = re4.exec(container)) !== null) {
          variants.push({ id: `v${variants.length+1}`, label: null, price: parseFloat(m[1]) });
        }
      }
    }

    // additional fallback: look at a 3000-char window after the article block in the page
    if (variants.length === 0) {
      const idx = pageHtml.indexOf(block);
      if (idx !== -1) {
        const region = pageHtml.slice(idx, idx + 3000);
        const re5 = /data-price=["']?([0-9]+(?:\.[0-9]+)?)["']?/gi;
        while ((m = re5.exec(region)) !== null) {
          variants.push({ id: `v${variants.length+1}`, label: null, price: parseFloat(m[1]) });
        }
      }
    }
  }

  // fallback: span with $XX.XX text anywhere in the block
  if (variants.length === 0) {
    const re3 = /\$([0-9]+(?:\.[0-9]{1,2})?)/g;
    let found;
    while ((found = re3.exec(block)) !== null) {
      variants.push({ id: 'variant-' + variants.length, label: null, price: parseFloat(found[1]) });
    }
  }

  // dedupe by price and then try to attach weights using heuristics
  const unique = [];
  variants.forEach(v => {
    if (!unique.some(u => u.price === v.price)) unique.push(v);
  });

  // Heuristic price->weight map using the article block and a window after it
  const priceWeightMap = findPriceWeightMap(block);
  if (pageHtml) {
    const idx = pageHtml.indexOf(block);
    if (idx !== -1) {
      const region = pageHtml.slice(idx, idx + 3000);
      Object.assign(priceWeightMap, findPriceWeightMap(region));
    }
  }

  return unique.map((v, i) => {
    const baseWeight = extractWeightFromLabel(v.label) || null;
    const hw = baseWeight || (priceWeightMap[v.price] ? priceWeightMap[v.price] : null);
    return { id: v.id || `v${i+1}`, label: v.label || null, price: Number(v.price.toFixed(2)), weight: hw };
  });
}

async function main() {
  const files = await readFiles();
  const existingRaw = await fs.readFile(PRODUCTS_JSON, 'utf8');
  const existing = JSON.parse(existingRaw);
  const existingMap = new Map();
  if (existing.products && Array.isArray(existing.products)) {
    existing.products.forEach(p => existingMap.set(p.id, p));
  }

  const found = new Map();

  for (const file of files) {
    const html = await fs.readFile(file, 'utf8');
    const blocks = extractArticleBlocks(html);
    for (const block of blocks) {
      const sku = extractField(block, 'data-sku');
      const idAttr = extractField(block, 'id');
      const id = sku || idAttr || slugify(extractName(block) || 'product');
      const name = extractName(block) || (existingMap.get(id) && existingMap.get(id).name) || id;
      const images = extractImages(block);
      const description = extractDescription(block) || (existingMap.get(id) && existingMap.get(id).description) || '';
      const variants = extractVariants(block);
      const defaultPrice = variants.length ? Math.min(...variants.map(v => v.price)) : (existingMap.get(id) && existingMap.get(id).price) || null;

      const inStock = extractAvailability(block);

      let product = {
        id: id,
        sku: sku || (existingMap.get(id) && existingMap.get(id).sku) || id,
        name: name,
        image: images[0] || (existingMap.get(id) && existingMap.get(id).image) || null,
        imageAlt: images.length ? '' : (existingMap.get(id) && existingMap.get(id).imageAlt) || '',
        images: images.length ? images : (existingMap.get(id) && existingMap.get(id).images) || [],
        description: description,
        inStock: inStock,
        options: variants.length ? variants.map((v, idx) => {
          // Prefer explicit input value captured earlier (like "pouch", "cylinder").
          // If that wasn't available, create a product-scoped id to avoid global collisions and to
          // make ids deterministic: `${productId}--${slugified-label-or-index}`.
          const rawId = v.id || '';
          const usesGenericVariant = /^variant-/.test(rawId) || rawId === '';
          const safeLabel = (v.label || (`${v.price.toFixed(2)}`)).toString();
          const generatedId = `${id}--${slugify(safeLabel)}`;
          const optId = usesGenericVariant ? generatedId : rawId;
          const label = v.label || `$${v.price.toFixed(2)}`;
          const weight = v.weight || null; // extracted earlier (e.g. "60 g")
          return { id: optId, label: label, price: v.price, ...(weight ? { weight } : {}) };
        }) : (existingMap.get(id) && existingMap.get(id).options) || [],
        price: defaultPrice,
      };

      if (existingMap.has(id)) {
        // merge non-destructively
        const orig = existingMap.get(id);
        product = Object.assign({}, orig, product);
        // prefer existing options if none discovered
        if ((!product.options || product.options.length === 0) && orig.options) product.options = orig.options;
        if (!product.price && orig.price) product.price = orig.price;
      }

      found.set(id, product);
    }
  }

  const productsArray = Array.from(found.values()).sort((a,b) => a.id.localeCompare(b.id));

  await fs.writeFile(OUTPUT, JSON.stringify({ products: productsArray }, null, 2), 'utf8');
  console.log(`Generated ${OUTPUT} with ${productsArray.length} products.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
