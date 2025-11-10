import routes from '../routes/routes';
import { setupSkipToContent, transitionHelper } from '../utils';
import { getActiveRoute } from '../routes/url-parser';
import { getAccessToken, getLogout } from '../utils/auth';
import { generateUnauthenticatedNavigationListTemplate, generateAuthenticatedNavigationListTemplate } from '../templates';
import * as NotificationHelper from '../utils/notification-helper.js';

class App {
  #content;
  #drawerButton;
  #navigationDrawer;
  #skipLinkButton;

  constructor({ content, navigationDrawer, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#skipLinkButton = skipLinkButton;

    this.#init();
  }

  #init() {
    if (this.#skipLinkButton && this.#content) {
      setupSkipToContent(this.#skipLinkButton, this.#content);
    }
    this.#setupDrawer();
  }

  #setupDrawer() {
    if (this.#drawerButton) {
      this.#drawerButton.addEventListener('click', () => {
        if (this.#navigationDrawer) {
          this.#navigationDrawer.classList.toggle('open');
        }
      });
    }

    document.body.addEventListener('click', (event) => {
      let isTargetInsideDrawer = false;
      let isTargetInsideButton = false;

      if (this.#navigationDrawer) {
        isTargetInsideDrawer = this.#navigationDrawer.contains(event.target);
      }

      if (this.#drawerButton) {
        isTargetInsideButton = this.#drawerButton.contains(event.target);
      }

      if (!(isTargetInsideDrawer || isTargetInsideButton)) {
        if (this.#navigationDrawer) {
          this.#navigationDrawer.classList.remove('open');
        }
      }

      if (this.#navigationDrawer) {
        this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
          if (link.contains(event.target)) {
            this.#navigationDrawer.classList.remove('open');
          }
        });
      }
    });
  }

  #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navList = document.getElementById('nav-list');

    if (!navList) {
      return;
    }

    const staticNav = `
        <li><a href="#/">Beranda</a></li>
        <li><a href="#/about">About</a></li>
    `;

    if (!isLogin) {
      navList.innerHTML = staticNav + generateUnauthenticatedNavigationListTemplate();
      return;
    }

    navList.innerHTML = staticNav + generateAuthenticatedNavigationListTemplate();

    const pushNotifButton = document.getElementById('push-notification-button');
    if (pushNotifButton) {
      pushNotifButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const { subscribed } = await NotificationHelper.toggleSubscription();
          if (subscribed) {
            alert('Notification berhasil di subscribe');
            pushNotifButton.textContent = 'Unsubscribe';
            pushNotifButton.setAttribute('aria-pressed', 'true');
          } else {
            alert('Anda berhenti berlangganan');
            pushNotifButton.textContent = 'Subscribe';
            pushNotifButton.setAttribute('aria-pressed', 'false');
          }
        } catch (error) {
          console.error('Toggle subscription error:', error);
          alert('Terjadi kesalahan saat mengubah status langganan');
        }
      });

    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', (event) => {
        event.preventDefault();

        if (confirm('Apakah Anda yakin ingin keluar?')) {
          getLogout();
          location.hash = '/login';
        }
      });
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    let routeKey = routes[url];

    if (!routeKey) {
      console.warn(`URL tidak terdaftar: "${url}"`);
    }
    const page = routeKey;
    if (!page) {
      console.error(`Tidak ada halaman untuk rute: "${url}".`);
      return;
    }

    const transition = transitionHelper({
      updateDOM: async () => {
        this.#content.innerHTML = await page.render();
        page.afterRender();
      },
      skipTransition: url === '/',
    });

    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: 'instant' });
      this.#setupNavigationList();
    });
  }
}

export default App;