import { fetchWithRetry } from '../lib/fetch';

export interface DiscordSinkConfig {
  webhook_urls: string[];
}

export async function postToDiscord(
  message: string,
  webhookUrls: string[]
): Promise<void> {
  const payload = {
    content: message,
    // username, avatar_url 等は必要に応じて拡張
  };

  const sendOne = async (url: string) => {
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      retries: 2,
      retryDelay: 1000,
      timeout: 10000,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord webhook error: ${res.status} ${res.statusText} - ${text}`);
    }
  };

  // ベストエフォートで並列送信（少数想定）。大量ならレート制御を導入。
  await Promise.all(
    webhookUrls.filter(Boolean).map(async (url) => {
      try {
        await sendOne(url);
        console.log(`Discord message sent to ${url}`);
      } catch (err) {
        console.error(`Failed to send Discord message to ${url}:`, err);
      }
    })
  );
}


