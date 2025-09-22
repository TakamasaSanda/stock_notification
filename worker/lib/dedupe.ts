import { Target } from './targets';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  date: Date;
}

export async function isNew(
  kv: KVNamespace,
  target: Target,
  source: 'pr' | 'x',
  itemId: string
): Promise<boolean> {
  const key = `state:${target.tenant_id}:${target.company_name}:${source}`;
  const lastSeenId = await kv.get(key);
  
  if (!lastSeenId) {
    return true; // 初回は新規として扱う
  }
  
  return lastSeenId !== itemId;
}

export async function setSeen(
  kv: KVNamespace,
  target: Target,
  source: 'pr' | 'x',
  itemId: string
): Promise<void> {
  const key = `state:${target.tenant_id}:${target.company_name}:${source}`;
  await kv.put(key, itemId);
}
