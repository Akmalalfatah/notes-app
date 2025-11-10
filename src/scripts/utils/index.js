export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export async function createCarousel(containerElement, options = {}) {
  const { tns } = await import('tiny-slider');

  return tns({
    container: containerElement,
    mouseDrag: true,
    swipeAngle: false,
    speed: 600,

    nav: true,
    navPosition: 'bottom',

    autoplay: false,
    controls: false,

    ...options,
  });
}

export function convertBlobToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export function convertBase64ToBlob(base64Data, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

export function convertBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

  export function setupSkipToContent(element, mainContent) {
    element.addEventListener('click', () => mainContent.focus());
  }

  export function transitionHelper({ skipTransition = false, updateDOM }) {
    if (skipTransition || typeof document.startViewTransition !== 'function') {
      const updateCallbackDone = (async () => {
        await updateDOM();
      })();

      return {
        ready: Promise.resolve(),
        updateCallbackDone,
        finished: updateCallbackDone,
      };
    }

    return document.startViewTransition(async () => {
      await updateDOM();
    });
  }

  export function isServiceWorkerAvailable() {
    return 'serviceWorker' in navigator;
  }

  export async function registerServiceWorker() {
    if (!isServiceWorkerAvailable()) {
      console.warn('tidak support Service Worker API');
      return null;
    }

    try {
      let registration = null;
      try {
        registration = await navigator.serviceWorker.register('/sw.js');
      } catch (rootErr) {
        registration = await navigator.serviceWorker.register('./sw.bundle.js');
      }
      console.log('Service Worker registered berhasil:', registration);
      return registration;
    } catch (error) {
      console.error('tidak bisa install Service Worker:', error);
      return null;
    }
  }

