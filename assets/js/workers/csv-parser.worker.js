// Dedicated Worker: CSV parser (simple, streaming-friendly)
self.onmessage = (e) => {
  const msg = e.data || {};
  if (msg.type !== 'PARSE') return;
  try {
    const text = atob(msg.chunkBase64 || '');
    const lines = text.split(/\r?\n/).filter(Boolean);
    const out = [];
    let headers = null;
    lines.forEach((line, i) => {
      const cells = splitCSV(line);
      if (!headers) { headers = cells; return; }
      const row = {}; headers.forEach((h, idx) => row[h] = cells[idx] || '');
      out.push(row);
    });
    postMessage({ type: 'PARSE_RESULT', id: msg.id, rowsCount: out.length, preview: out.slice(0, 20), errors: [] });
  } catch (err) {
    postMessage({ type: 'PARSE_RESULT', id: msg.id, rowsCount: 0, preview: [], errors: [String(err && err.message || err)] });
  }
};

function splitCSV(str){
  const res = []; let cur = ''; let inQ = false;
  for (let i = 0; i < str.length; i++){
    const ch = str[i]; const nxt = str[i+1];
    if (ch === '"') { if (inQ && nxt === '"') { cur += '"'; i++; } else { inQ = !inQ; } continue; }
    if (ch === ',' && !inQ) { res.push(cur); cur=''; continue; }
    cur += ch;
  }
  res.push(cur);
  return res;
}
