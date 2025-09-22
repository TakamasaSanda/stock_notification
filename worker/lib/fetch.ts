export interface FetchOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit & FetchOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    ...fetchOptions
  } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'User-Agent': 'StockNotification/1.0',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // レート制限やサーバーエラーの場合はリトライ
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt); // 指数バックオフ
          console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      
      const delay = retryDelay * Math.pow(2, attempt);
      console.log(`Retrying in ${delay}ms due to error (attempt ${attempt + 1}/${retries + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
