import '../styles/styles.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './pages/app';
import { registerServiceWorker } from './utils';
import { syncPendingStories } from './utils/sync-helper';
 
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
    skipLinkButton: document.querySelector('#skip-link'),
  });
  await app.renderPage();

  const registration = await registerServiceWorker();
  if (registration) {
    console.log('service worker aktif dan akan menerima notifikasi');
  }
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('service worker: ', event.data);
  });

  window.addEventListener('online', async () => {
    await syncPendingStories();
  });

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});
