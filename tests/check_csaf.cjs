const fs = require('fs');

function assert(condition, message) {
  if (!condition) {
    console.error('Assertion failed:', message);
    process.exit(1);
  }
}

// security.txt check
const sec = fs.readFileSync('.well-known/security.txt', 'utf-8');
assert(/CSAF:\s*https:\/\//.test(sec), 'security.txt must contain a CSAF https URL');
console.log('security.txt CSAF field present');

// provider-metadata.json parsing and keys
const metaText = fs.readFileSync('.well-known/csaf/provider-metadata.json', 'utf-8');
let meta;
try { meta = JSON.parse(metaText); } catch (e) {
  console.error('provider-metadata.json is not valid JSON');
  process.exit(1);
}
['metadata_version', 'canonical_url', 'publisher', 'last_updated'].forEach(k => {
  assert(meta.hasOwnProperty(k), `provider-metadata.json missing '${k}'`);
});
console.log('provider-metadata.json parsed and contains required keys');

console.log('CSAF checks passed');
