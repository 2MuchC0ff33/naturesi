const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'assets', 'js', 'data');
const infile = path.join(dataDir, 'australian_postcodes.json');
const backupFile = path.join(dataDir, 'australian_postcodes.raw.json');
const outfile = infile; // overwrite original after backup

function uniq(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
}

function safeNum(v) {
    return typeof v === 'number' ? v : (v === '' || v == null ? null : Number(v));
}

console.log('Reading', infile);
const raw = fs.readFileSync(infile, 'utf8');
let arr;
try {
    arr = JSON.parse(raw);
} catch (err) {
    console.error('Failed to parse JSON:', err.message);
    process.exit(2);
}

// Group by postcode
const map = Object.create(null);

for (const item of arr) {
    const pc = (item.postcode || '').toString().padStart(4, '0');
    if (!pc) continue;

    if (!map[pc]) {
        map[pc] = {
            state: item.state || '',
            localities: [],
            latSum: 0,
            longSum: 0,
            coordsCount: 0,
            chargezone: item.chargezone || '',
            region: item.region || '',
            ra_2016: item.RA_2016 || '',
            mmm_2019: item.MMM_2019 || ''
        };
    }

    const entry = map[pc];

    if (item.locality && !entry.localities.includes(item.locality)) entry.localities.push(item.locality);

    const lat = safeNum(item.Lat_precise) ?? safeNum(item.lat);
    const long = safeNum(item.Long_precise) ?? safeNum(item.long);
    if (typeof lat === 'number' && !Number.isNaN(lat)) {
        entry.latSum += lat;
        entry.coordsCount += 1;
    }
    if (typeof long === 'number' && !Number.isNaN(long)) {
        entry.longSum += long;
    }

    // Prefer more specific values if present
    if (!entry.chargezone && item.chargezone) entry.chargezone = item.chargezone;
    if (!entry.region && item.region) entry.region = item.region;
    if (!entry.state && item.state) entry.state = item.state;
    if ((!entry.ra_2016 || entry.ra_2016 === '') && (item.RA_2016 || item.RA_2016 === 0)) entry.ra_2016 = item.RA_2016;
    if ((!entry.mmm_2019 || entry.mmm_2019 === '') && (item.MMM_2019 || item.MMM_2019 === 0)) entry.mmm_2019 = item.MMM_2019;
}

// Build compact structure
const compact = {
    meta: {
        version: '1.0.0',
        source: 'AUSPOST / Refactored for naturesi',
        lastUpdated: new Date().toISOString().split('T')[0]
    },
    postcodes: {}
};

for (const [pc, entry] of Object.entries(map)) {
    const lat = entry.coordsCount ? +(entry.latSum / entry.coordsCount).toFixed(6) : null;
    const long = entry.coordsCount ? +(entry.longSum / entry.coordsCount).toFixed(6) : null;

    compact.postcodes[pc] = {
        state: entry.state || '',
        localities: uniq(entry.localities).slice(0, 20),
        lat: lat,
        long: long,
        chargezone: entry.chargezone || '',
        region: entry.region || '',
        ra_2016: entry.ra_2016 || '',
        mmm_2019: entry.mmm_2019 || ''
    };
}

// Backup original
console.log('Writing backup to', backupFile);
fs.writeFileSync(backupFile, raw, 'utf8');

// Write compact file
console.log('Writing compact postcodes to', outfile);
fs.writeFileSync(outfile, JSON.stringify(compact, null, 2), 'utf8');

console.log('Done. Original backed up as', path.basename(backupFile));
