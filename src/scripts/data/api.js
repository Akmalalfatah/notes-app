import { getAccessToken } from '../utils/auth';
import { CONFIG } from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  
  STORY_LIST: `${CONFIG.BASE_URL}/stories`,
  STORE_NEW_STORY: `${CONFIG.BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`, 
};

export async function getRegistered({ name, email, password }) {
  const data = JSON.stringify({ name, email, password });

  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function getLogin({ email, password }) {
  const data = JSON.stringify({ email, password });
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await response.json();
  return { ...json, ok: response.ok, status: response.status };
}

export async function getAllStories(query = '?page=1&size=8') {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Silakan login terlebih dahulu.');
  }

  const response = await fetch(`${ENDPOINTS.STORY_LIST}${query}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function storeNewStory({ description, photo }) {
  const token = getAccessToken();

  if (!token) {
      throw new Error("Akses ditolak. Anda harus login");
  }

  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo); 

  const options = {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  };

  const fetchResponse = await fetch(ENDPOINTS.STORE_NEW_STORY, options);
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function subscribePushNotification(subscription) {
  if (!subscription) {
    console.error('Subscription kosong!');
    return;
  }

  const subJson = subscription.toJSON ? subscription.toJSON() : {};
  const keys = subJson.keys || {};

  const payload = {
    endpoint: subJson.endpoint || subscription.endpoint,
    keys: {
      p256dh: keys.p256dh || null,
      auth: keys.auth || null,
    },
  };

  console.log('Payload dikirim ke server:', payload);

  return fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

 
export async function unsubscribePushNotification({ endpoint }) {
  console.log('unsubscribePushNotification called', endpoint);
  return { ok: true, message: 'no-op' };
}