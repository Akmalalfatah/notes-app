const DB_NAME = 'bukukami-db';
const DB_VERSION = 2;
const STORE_SUBSCRIPTION = 'subscriptions';
const STORE_STORIES = 'stories';        
const STORE_PENDING = 'pending_stories';
const STORE_BOOKMARKS = 'bookmarks';      

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

      if (!db.objectStoreNames.contains(STORE_BOOKMARKS)) {
        db.createObjectStore(STORE_BOOKMARKS, { keyPath: 'id' });
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
    request.onsuccess = () => resolve(request.result || []);
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

export async function saveStory(story) {
  const db = await openDB();
  const tx = db.transaction(STORE_BOOKMARKS, 'readwrite');
  const store = tx.objectStore(STORE_BOOKMARKS);
  store.put(story);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  console.log('Story tersimpan di bookmark IndexedDB:', story.id);
}

export async function getAllStories() {
  const db = await openDB();
  const tx = db.transaction(STORE_BOOKMARKS, 'readonly');
  const store = tx.objectStore(STORE_BOOKMARKS);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoryById(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_BOOKMARKS, 'readonly');
  const store = tx.objectStore(STORE_BOOKMARKS);
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function isStorySaved(id) {
  const story = await getStoryById(id);
  return !!story;
}

export async function deleteStory(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_BOOKMARKS, 'readwrite');
  const store = tx.objectStore(STORE_BOOKMARKS);
  store.delete(id);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  console.log('Story dihapus dari bookmark IndexedDB:', id);
}

export async function clearBookmarks() {
  const db = await openDB();
  const tx = db.transaction(STORE_BOOKMARKS, 'readwrite');
  const store = tx.objectStore(STORE_BOOKMARKS);
  store.clear();
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  console.log('Semua bookmark dihapus dari IndexedDB');
}

export async function toggleSaveStory(story) {
  const isSaved = await isStorySaved(story.id);
  if (isSaved) {
    await deleteStory(story.id);
    return false;
  } else {
    await saveStory(story);
    return true;
  }
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
  console.log('Stories tersimpan di cache IndexedDB:', stories.length);
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
  console.log('Semua story dihapus dari cache IndexedDB');
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
    request.onsuccess = () => resolve(request.result || []);
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
