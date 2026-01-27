export async function requestBackgroundSync(tag = 'sync-cart') {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register(tag);
    return true;
  } catch (e) {
    return false;
  }
}
