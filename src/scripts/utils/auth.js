import { ACCESS_TOKEN_KEY } from '../config';

export function getAccessToken() {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
  } catch (error) {
    console.error('getAccessToken error:', error);
    return null;
  }
}

export function putAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('putAccessToken error:', error);
    return false;
  }
}

export function removeAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('removeAccessToken error:', error);
    return false;
  }
}

export function getLogout() {
  removeAccessToken();
  location.hash = '/login';
}
