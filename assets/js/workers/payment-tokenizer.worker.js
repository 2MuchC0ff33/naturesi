// Dedicated Worker: Payment Tokenizer using WebCrypto when possible
self.onmessage = async (e) => {
  const msg = e.data || {};
  if (msg.type !== 'TOKENIZE') return;
  const { id, card = {}, keyHint } = msg;
  try {
    const payload = JSON.stringify({ card: { number: card.number ? 'REDACTED' : '', expiry: card.expiry || '', cvc: card.cvc ? 'REDACTED' : '' }, ts: Date.now(), keyHint: keyHint || null });

    // Prefer encrypting with provided JWK public key (RSA-OAEP)
    if (msg.publicKey && msg.publicKey.kty && (msg.publicKey.alg === 'RSA-OAEP' || (msg.publicKey.alg || '').startsWith('RSA'))) {
      try {
        const jwk = msg.publicKey;
        const subtle = self.crypto.subtle;
        const key = await subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }, false, ['encrypt']);
        const encoded = new TextEncoder().encode(JSON.stringify(card));
        const cipher = await subtle.encrypt({ name: 'RSA-OAEP' }, key, encoded);
        const token = bufToBase64(new Uint8Array(cipher));
        postMessage({ type: 'TOKEN', id, token });
        return;
      } catch (err) {
        // fall through to fallback token
        console.warn('Tokenization via RSA-OAEP failed', err);
      }
    }

    // Fallback: derive a SHA-256 hash of the card snippet + random salt and return base64
    const salt = crypto.getRandomValues(new Uint8Array(8));
    const text = `${card.number || ''}|${card.expiry || ''}|${card.cvc || ''}|${Date.now()}|${bufToBase64(salt)}`;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const token = bufToBase64(new Uint8Array(digest));
    postMessage({ type: 'TOKEN', id, token });
  } catch (err) {
    postMessage({ type: 'ERROR', id, message: String(err && err.message || err) });
  }
};

function bufToBase64(buf){ let s = ''; for (let i=0;i<buf.length;i+=16384) s += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i+16384))); return btoa(s); }
