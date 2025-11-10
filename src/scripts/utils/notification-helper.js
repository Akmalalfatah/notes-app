import { convertBase64ToUint8Array } from './index';
import { VAPID_PUBLIC_KEY } from '../config';
import { subscribePushNotification } from '../data/api';
import { saveSubscription, deleteSubscription } from './db-helper';

console.log('NotificationHelper loaded');

export function isNotificationAvailable() {
    return 'Notification' in window;
}

export function isNotificationGranted() {
    return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
    if (!isNotificationAvailable()) {
        console.error('Tidak support Notification API');
        return false;
    }

    if (isNotificationGranted()) return true;

    const status = await Notification.requestPermission();
    if (status !== 'granted') {
        alert('Izin notifikasi ditolak atau diabaikan.');
        return false;
    }

    return true;
}

export async function getPushSubscription() {
    const registration = await navigator.serviceWorker.getRegistration();
    return await registration?.pushManager?.getSubscription();
}

export async function isSubscribed() {
    return !!(await getPushSubscription());
}

export async function subscribe() {
    console.log('Memulai proses subscribe');
    const granted = await requestNotificationPermission();
    console.log('Permission granted?', granted);

    if (!granted) return;

    const registration = await navigator.serviceWorker.ready;
    console.log('SW ready:', registration);

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    console.log('Subscription berhasil:', subscription);

    await saveSubscription(subscription.toJSON());
    localStorage.setItem('isSubscribed', 'true');

    const worker = registration.active || registration.waiting || registration.installing;
    worker?.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'Notifikasi diaktifkan!',
        body: 'Anda saat ini mulai berlangganan notifikasi.',
    });

    console.log('Pesan dikirim ke SW');
    alert('Anda saat ini mulai berlangganan notifikasi');
    startPeriodicNotifications(60 * 1000);
}


export async function unsubscribe() {
    const subscription = await getPushSubscription();
    if (!subscription) {
        alert('Belum ada langganan aktif.');
        return;
    }

    await deleteSubscription(subscription.endpoint);
    await subscription.unsubscribe();
    localStorage.removeItem('isSubscribed');

    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active || registration.waiting || registration.installing;
    worker?.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'Berhenti Berlangganan',
        body: 'Anda berhenti berlangganan notifikasi.',
    });

    alert('Anda berhenti berlangganan notifikasi');
    stopPeriodicNotifications();
}

let __pushIntervalId = null;

export async function startPeriodicNotifications(intervalMs = 60 * 1000) {
    if (!('serviceWorker' in navigator)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        if (__pushIntervalId) clearInterval(__pushIntervalId);

        __pushIntervalId = setInterval(() => {
            try {
                const worker = registration.active || registration.waiting || registration.installing;
                worker?.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title: 'Waktunya Menulis',
                    body: 'Saatnya kamu membuat story yang keren, jangan kalah sama author yang lain',
                    actions: [
                        {
                            action: 'open-add-page',
                            title: 'Buat Story'
                        }
                    ],
                    data: { url: '#/add' }
                });
                console.log('Periodic message sent to SW');
            } catch (err) {
                console.error('Failed to send periodic message to SW', err);
            }
        }, intervalMs);

        console.log('Notifikasi berkala dimulai:', intervalMs);
    } catch (err) {
        console.error('Tidak dapat memulai notifikasi berkala', err);
    }
}

export function stopPeriodicNotifications() {
    if (__pushIntervalId) {
        clearInterval(__pushIntervalId);
        __pushIntervalId = null;
        console.log('Notifikasi berkala dihentikan');
    }
}

if (localStorage.getItem('isSubscribed') === 'true') {
    startPeriodicNotifications(60 * 1000);
}

export async function toggleSubscription() {
    if (await isSubscribed()) {
        await unsubscribe();
        return { subscribed: false };
    } else {
        await subscribe();
        return { subscribed: true };
    }
}
