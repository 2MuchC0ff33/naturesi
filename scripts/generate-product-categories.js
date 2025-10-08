#!/usr/bin/env node
/*
  Script: generate-product-categories.js
  Purpose: Read products.json and produce a product->category mapping file
  Behaviour: Preserve existing mappings in product-categories.json (if present), fill unmapped product IDs using heuristics, and write a sorted mapping back to the same file.
*/
const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '..', 'assets', 'js', 'data', 'products.json');
const mappingPath = path.join(__dirname, '..', 'assets', 'js', 'data', 'product-categories.json');

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

const productsWrapped = readJSON(productsPath);
if (!productsWrapped || !Array.isArray(productsWrapped.products)) {
  console.error('Unable to read products array from', productsPath);
  process.exit(2);
}

const existing = readJSON(mappingPath) || { mapping: {} };
const existingMap = existing.mapping || {};

const heuristics = (p) => {
  const id = (p.id || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  // explicit keyword checks
  if (/balm/.test(name) || id.includes('balm')) return 'balms';
  if (/cream|calendula/.test(name) || id.includes('calendula')) return 'creams';
  if (
    /pillow|flask|infuser|bag|scoop|pot/.test(name) ||
    /pillow|flask|infuser|bag|scoop|pot/.test(id)
  )
    return 'accessories';
  if (/chai|earl|breakfast|black|ceylon/.test(name) || /ceylon|english|french/.test(id))
    return 'black-tea';
  if (/green|sencha/.test(name) || /green|sencha/.test(id)) return 'green-tea';
  if (
    /hibiscus|summer|apple|detox|hormone|calming|sleep|turmeric|botanic|digestive|winter/.test(name)
  )
    return 'wellness-blends';
  if (/artisan|african|chai/.test(name) || id.includes('artisan') || id.includes('african'))
    return 'artisan-blends';
  if (/ice/.test(name) || id.includes('ice')) return 'ice-tea';
  if (/magnesium|flakes|bath/.test(name) || id.includes('magnesium')) return 'selfcare';
  // default
  return 'wellness-blends';
};

const out = { mapping: {} };
productsWrapped.products.forEach((p) => {
  if (existingMap[p.id]) {
    out.mapping[p.id] = existingMap[p.id];
  } else {
    out.mapping[p.id] = heuristics(p);
  }
});

// sort keys for stable output
const sorted = Object.keys(out.mapping)
  .sort()
  .reduce((acc, k) => {
    acc[k] = out.mapping[k];
    return acc;
  }, {});

const final = { mapping: sorted };
fs.writeFileSync(mappingPath, JSON.stringify(final, null, 2) + '\n', 'utf8');
console.log('Wrote', mappingPath);
