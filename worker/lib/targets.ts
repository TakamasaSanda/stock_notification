import { Env } from '../index';

export interface Target {
  tenant_id: string;
  company_name: string;
  pr_url: string;
  twitter_id: string;
  x_feed_url: string;
  line_user_id: string;
  enabled: boolean;
}

export async function listTargets(kv: KVNamespace): Promise<Target[]> {
  try {
    const data = await kv.get('targets:active', 'json');
    if (!data) {
      console.warn('No targets found in KV store');
      return [];
    }
    return data as Target[];
  } catch (error) {
    console.error('Error loading targets from KV:', error);
    return [];
  }
}

export function validateTarget(target: any): target is Target {
  return (
    typeof target.tenant_id === 'string' &&
    typeof target.company_name === 'string' &&
    typeof target.pr_url === 'string' &&
    typeof target.twitter_id === 'string' &&
    typeof target.x_feed_url === 'string' &&
    typeof target.line_user_id === 'string' &&
    typeof target.enabled === 'boolean'
  );
}
