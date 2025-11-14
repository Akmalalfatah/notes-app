export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.bundle.js');
    console.log('SW registered:', reg);
  } catch (err) {
    console.error('SW failed:', err);
  }
}
