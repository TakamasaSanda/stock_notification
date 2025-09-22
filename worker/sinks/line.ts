import { Env } from '../index';

export async function pushLine(env: Env, to: string, text: string): Promise<void> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.LINE_CHANNEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        messages: [
          {
            type: 'text',
            text: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LINE API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log(`LINE message sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending LINE message:', error);
    throw error;
  }
}
