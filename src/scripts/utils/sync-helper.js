import { getPendingStories, deletePendingStory } from './db-helper';

export async function syncPendingStories() {
  const pending = await getPendingStories();
  if (pending.length === 0) return;

  console.log(`Mengirim ${pending.length} story ke server`);

  for (const story of pending) {
    try {
      const response = await fetch('https://story-api.dicoding.dev/v1/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });

      if (response.ok) {
        await deletePendingStory(story.tempId);
        console.log(' Story terkirim:', story.tempId);
      } else {
        console.warn('Gagal kirim story:', story.tempId);
      }
    } catch (err) {
      console.error('Error saat mengirim story:', err);
    }
  }
}
