// Dedicated Worker: Image Processor (basic stub with OffscreenCanvas)
self.onmessage = async (e) => {
  const msg = e.data || {};
  if (msg.type !== 'PROCESS') return;
  try {
    const { id, imageDataUrl, operations = {} } = msg;
    const blob = await (await fetch(imageDataUrl)).blob();
    const bmp = await createImageBitmap(blob);
    const width = operations.resize && operations.resize.width || bmp.width;
    const height = operations.resize && operations.resize.height || bmp.height;

    if (typeof OffscreenCanvas === 'undefined') {
      // Fallback: return original
      const url = URL.createObjectURL(blob);
      postMessage({ type: 'RESULT', id, blobUrl: url, meta: { width: bmp.width, height: bmp.height, size: blob.size } });
      return;
    }
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0, width, height);
    const type = (operations.format || 'image/jpeg');
    const quality = operations.quality != null ? operations.quality : 0.85;
    const outBlob = await canvas.convertToBlob({ type, quality });
    const outUrl = URL.createObjectURL(outBlob);
    postMessage({ type: 'RESULT', id, blobUrl: outUrl, meta: { width, height, size: outBlob.size } });
  } catch (err) {
    postMessage({ type: 'ERROR', id: msg.id, message: String(err && err.message || err) });
  }
};
