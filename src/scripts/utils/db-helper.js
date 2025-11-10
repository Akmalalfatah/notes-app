const DB_NAME = 'bukukami-db';
const DB_VERSION = 2;
const STORE_SUBSCRIPTION = 'subscriptions';
const STORE_STORIES = 'stories';
const STORE_PENDING = 'pending_stories';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Gagal membuka IndexedDB');
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_SUBSCRIPTION)) {
        db.createObjectStore(STORE_SUBSCRIPTION, { keyPath: 'endpoint' });
      }

      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        db.createObjectStore(STORE_STORIES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: 'tempId', autoIncrement: true });
      }
    };
  });
}

export async function saveSubscription(subscription) {
  const db = await openDB();
  const tx = db.transaction(STORE_SUBSCRIPTION, 'readwrite');
  const store = tx.objectStore(STORE_SUBSCRIPTION);
  store.put(subscription);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllSubscriptions() {
  const db = await openDB();
  const tx = db.transaction(STORE_SUBSCRIPTION, 'readonly');
  const store = tx.objectStore(STORE_SUBSCRIPTION);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSubscription(endpoint) {
  const db = await openDB();
  const tx = db.transaction(STORE_SUBSCRIPTION, 'readwrite');
  const store = tx.objectStore(STORE_SUBSCRIPTION);
  store.delete(endpoint);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveStories(stories) {
  const db = await openDB();
  const tx = db.transaction(STORE_STORIES, 'readwrite');
  const store = tx.objectStore(STORE_STORIES);
  for (const story of stories) {
    store.put(story);
  }
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllStories() {
  const db = await openDB();
  const tx = db.transaction(STORE_STORIES, 'readonly');
  const store = tx.objectStore(STORE_STORIES);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteStory(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_STORIES, 'readwrite');
  const store = tx.objectStore(STORE_STORIES);
  store.delete(id);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStories() {
  const db = await openDB();
  const tx = db.transaction(STORE_STORIES, 'readwrite');
  const store = tx.objectStore(STORE_STORIES);
  store.clear();
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function savePendingStory(story) {
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, 'readwrite');
  const store = tx.objectStore(STORE_PENDING);
  store.put(story);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingStories() {
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, 'readonly');
  const store = tx.objectStore(STORE_PENDING);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePendingStory(tempId) {
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, 'readwrite');
  const store = tx.objectStore(STORE_PENDING);
  store.delete(tempId);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
