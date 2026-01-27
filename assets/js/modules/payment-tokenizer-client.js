// Payment tokenizer client — uses a dedicated worker to keep sensitive operations off main thread
export function createTokenizer(){
  if (!(window.WorkerRegistry && window.WorkerRegistry.supports && window.WorkerRegistry.supports.worker)) return null;
  try {
    const w = window.WorkerRegistry.createWorker('/assets/js/workers/payment-tokenizer.worker.js');
    if (!w) return null;
    const pending = new Map();
    w.onmessage = (e) => {
      const m = e.data || {};
      if (m && m.type === 'TOKEN' && pending.has(m.id)) {
        const { resolve } = pending.get(m.id); pending.delete(m.id); resolve(m.token);
      }
      if (m && m.type === 'ERROR' && pending.has(m.id)) {
        const { reject } = pending.get(m.id); pending.delete(m.id); reject(new Error(m.message || 'Tokenization error'));
      }
    };
    return {
      tokenize: async (card, options = {}) => {
        const id = String(Date.now()) + '-' + Math.random().toString(16).slice(2,8);
        return new Promise((resolve, reject) => {
          pending.set(id, { resolve, reject });
          w.postMessage({ type: 'TOKENIZE', id, card, publicKey: options.publicKey || null, keyHint: options.keyHint || null });
        });
      },
      dispose: () => { try { w.terminate(); } catch(_){} }
    };
  } catch (e) { console.warn('Tokenizer unavailable', e); return null; }
}

if (typeof window !== 'undefined' && !window.PaymentTokenizer) window.PaymentTokenizer = { createTokenizer };
