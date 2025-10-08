#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
  const results = [];
  for (const name of fs.readdirSync(dir)) {
    // skip node_modules and .git for safety
    if (name === 'node_modules' || name === '.git') continue;
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      results.push(...getHtmlFiles(file));
    } else if (stat.isFile() && file.endsWith('.html')) {
      results.push(file);
    }
  }
  return results;
}

function fixFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  let out = src;

  // Uppercase DOCTYPE
  out = out.replace(/<!doctype\s+html\s*>/i, '<!DOCTYPE html>');

  // Convert legacy meta Content-Type to HTML5 charset
  out = out.replace(
    /<meta\s+http-equiv=["']Content-Type["']\s+content=["']text\/html;\s*charset=[^"']+["']\s*\/?\s*>/gi,
    '<meta charset="utf-8">'
  );

    // Normalize the viewport meta to a safe, conventional value if present
    out = out.replace(
      /<meta\s+name=["']viewport["'][^>]*>/gi,
      '<meta name="viewport" content="width=device-width,initial-scale=1">'
    );

    // Normalize format-detection meta that may contain nested quotes
    out = out.replace(
      /<meta\s+name=["']format-detection["'][^>]*>/gi,
      '<meta name="format-detection" content="telephone=yes,email=yes,address=yes">'
    );

    // Normalize Permissions-Policy meta values with nested quotes
    out = out.replace(
      /<meta\s+http-equiv=["']Permissions-Policy["'][^>]*>/gi,
      '<meta http-equiv="Permissions-Policy" content="geolocation=(),microphone=(),camera=()">'
    );

    // Normalize JSON-LD SearchAction query-input string (escape or remove nested quotes)
    out = out.replace(/"query-input"\s*:\s*"required name=\"search_term_string\""/g, '"query-input": "required name=search_term_string"');

  // Normalize void elements: remove trailing slash for common void tags
  // Replace '<tag ... />' with '<tag ...>' for common void tags while preserving attributes
  out = out.replace(
    /<(meta|link|img|input|br|hr|source|track|base|area|col|embed|param)\b([^>]*)\/>/gi,
    '<$1$2>'
  );

  // Add type="button" to <button> elements missing a type attribute
  out = out.replace(/<button\b([^>]*)>/gi, (m, attrs) => {
    if (/\btype\s*=/.test(attrs)) return `<button${attrs}>`;
    return `<button type="button"${attrs}>`;
  });

  // Quote unquoted attribute values like class=foo -> class="foo"
  out = out.replace(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)=([^"'\s>]+)/g, ' $1="$2"');

  // Ensure there's a space between adjacent attributes when missing: '"attr=' -> '" attr='
  out = out.replace(/"(?=[A-Za-z_:][-A-Za-z0-9_:.]*=)/g, '" ');

  // Remove redundant roles on semantic elements
  // header role="banner"
  out = out.replace(/<header\b([^>]*)\srole=["']banner["']([^>]*)>/gi, '<header$1$2>');
  // main role="main"
  out = out.replace(/<main\b([^>]*)\srole=["']main["']([^>]*)>/gi, '<main$1$2>');
  // footer role="contentinfo"
  out = out.replace(/<footer\b([^>]*)\srole=["']contentinfo["']([^>]*)>/gi, '<footer$1$2>');
  // summary role="button"
  out = out.replace(/<summary\b([^>]*)\srole=["']button["']([^>]*)>/gi, '<summary$1$2>');
  // nav role="navigation"
  out = out.replace(/<nav\b([^>]*)\srole=["']navigation["']([^>]*)>/gi, '<nav$1$2>');
  // a role="link"
  out = out.replace(/<a\b([^>]*)\srole=["']link["']([^>]*)>/gi, '<a$1$2>');

  // Run post-processing fixes (details/fieldset insertion and similar)
  out = postProcessContent(out);

  if (out !== src) {
    // write a backup and then overwrite
    try {
      fs.copyFileSync(file, file + '.bak');
    } catch (e) {
      // ignore backup errors
    }
    fs.writeFileSync(file, out, 'utf8');
    console.log('fixed:', file);
  }
}


// Insert <summary> where <details> lacks one, and add <legend> to <fieldset> missing legend
function postProcessContent(src) {
  let out = src;
  // details without summary -> insert minimal visually-hidden summary
  out = out.replace(/<details\b([^>]*)>([\s\S]*?)<\/details>/gi, (m, attrs, inner) => {
  if (/\s*<summary\b/i.test(inner)) return `<details${attrs}>${inner}</details>`;
    return `<details${attrs}><summary class="visually-hidden">Details</summary>${inner}</details>`;
  });

  // fieldset without legend -> insert minimal visually-hidden legend as first child
  out = out.replace(/<fieldset\b([^>]*)>([\s\S]*?)<\/fieldset>/gi, (m, attrs, inner) => {
  if (/\s*<legend\b/i.test(inner)) return `<fieldset${attrs}>${inner}</fieldset>`;
    return `<fieldset${attrs}><legend class="visually-hidden">Details</legend>${inner}</fieldset>`;
  });

  return out;
}

function main() {
  const root = path.resolve(__dirname, '..');
  const files = getHtmlFiles(root);
  console.log('checking', files.length, 'HTML files');
  for (const f of files) {
    fixFile(f);
  }
  console.log('done');
}

main();
