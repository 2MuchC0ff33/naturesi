// scripts/validate-products.js
// Simple checks for products.generated.json: unique ids, every product has numeric price and at least one option (if applicable)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATED = path.join(__dirname, '..', 'assets', 'js', 'data', 'products.generated.json');

async function main() {
  const raw = await fs.readFile(GENERATED, 'utf8');
  const parsed = JSON.parse(raw);
  const products = parsed.products || [];
  const ids = new Set();
  const issues = [];

  const errors = [];
  const warnings = [];

  products.forEach(p => {
    if (!p.id) errors.push(`missing id for product: ${JSON.stringify(p).slice(0,60)}`);
    if (ids.has(p.id)) errors.push(`duplicate id: ${p.id}`);
    ids.add(p.id);
    if (!p.name) errors.push(`missing name for ${p.id}`);

    // if product is in stock, ensure price exists and options non-empty (if options expected)
    if (p.inStock) {
      if (typeof p.price !== 'number' || Number.isNaN(p.price)) errors.push(`invalid price for ${p.id}: ${p.price}`);
      if (!p.options || p.options.length === 0) warnings.push(`no options for ${p.id}`);
      // If product has multiple options, prefer each option to include a weight for accurate postage
      if (p.options && p.options.length > 1) {
        const hasWeight = p.options.some((o) => o && (o.weight || o.weight === 0));
        if (!hasWeight) warnings.push(`multi-option product missing option weights: ${p.id}`);
      }
    } else {
      // out-of-stock products are allowed to have no price/options but should be reviewed
      warnings.push(`out-of-stock (no price expected) for ${p.id}`);
    }
  });

  if (errors.length) {
    console.error('Validation failed with errors:');
    errors.forEach(i => console.error('-', i));
    process.exit(2);
  }

  if (warnings.length) {
    console.warn('Validation passed with warnings:');
    warnings.forEach(w => console.warn('-', w));
  }

  console.log(`Validation passed: ${products.length} products OK.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
