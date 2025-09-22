import { fetchWithRetry } from '../lib/fetch';
import { NewsItem } from '../lib/dedupe';
import { Env } from '../index';

export async function fetchX(xFeedUrl: string, env: Env): Promise<NewsItem | null> {
  try {
    const response = await fetchWithRetry(xFeedUrl, {
      retries: 2,
      timeout: 15000,
    });

    if (!response.ok) {
      console.error(`Failed to fetch X RSS: ${response.status} ${response.statusText}`);
      return null;
    }

    const text = await response.text();
    const items = parseRSS(text);
    
    if (items.length === 0) {
      console.warn('No items found in X RSS feed');
      return null;
    }

    // 最新のアイテムを返す
    return items[0];
  } catch (error) {
    console.error('Error fetching X RSS:', error);
    return null;
  }
}

function parseRSS(xmlText: string): NewsItem[] {
  try {
    // 簡易的なRSSパーサー（XのRSSフィード用）
    const items: NewsItem[] = [];
    
    // <item>タグを抽出
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title[^>]*>([^<]*)<\/title>/i);
      const linkMatch = itemXml.match(/<link[^>]*>([^<]*)<\/link>/i);
      const guidMatch = itemXml.match(/<guid[^>]*>([^<]*)<\/guid>/i);
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>([^<]*)<\/pubDate>/i);
      
      if (titleMatch && linkMatch) {
        const title = titleMatch[1].trim();
        const url = linkMatch[1].trim();
        const id = guidMatch ? guidMatch[1].trim() : url;
        const date = pubDateMatch ? new Date(pubDateMatch[1].trim()) : new Date();
        
        items.push({
          id,
          title,
          url,
          date,
        });
      }
    }
    
    // 日付順でソート（新しい順）
    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return items;
  } catch (error) {
    console.error('Error parsing X RSS:', error);
    return [];
  }
}
