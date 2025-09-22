import { listTargets } from './lib/targets';
import { fetchPR } from './adapters/pr_rss';
import { fetchX } from './adapters/x_rss';
import { isNew, setSeen } from './lib/dedupe';
import { pushLine } from './sinks/line';

export interface Env {
  TARGETS: KVNamespace;
  STATE: KVNamespace;
  DB: D1Database;
  LINE_CHANNEL_TOKEN: string;
  LINE_DEFAULT_USER: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Starting scheduled job:', event.cron);
    
    try {
      const targets = await listTargets(env.TARGETS);
      console.log(`Found ${targets.length} targets`);
      
      for (const target of targets.filter(t => t.enabled)) {
        console.log(`Processing target: ${target.company_name}`);
        
        // PR監視
        if (target.pr_url) {
          try {
            const item = await fetchPR(target.pr_url, env);
            if (item && await isNew(env.STATE, target, 'pr', item.id)) {
              const message = `[PR] ${target.company_name}\n${item.title}\n${item.url}`;
              await pushLine(env, target.line_user_id, message);
              await setSeen(env.STATE, target, 'pr', item.id);
              console.log(`Sent PR notification for ${target.company_name}`);
            }
          } catch (error) {
            console.error(`Error processing PR for ${target.company_name}:`, error);
          }
        }
        
        // X監視（RSSが用意されている場合のみ）
        if (target.x_feed_url) {
          try {
            const item = await fetchX(target.x_feed_url, env);
            if (item && await isNew(env.STATE, target, 'x', item.id)) {
              const message = `[X] ${target.company_name}\n${item.title || ''}\n${item.url}`;
              await pushLine(env, target.line_user_id, message);
              await setSeen(env.STATE, target, 'x', item.id);
              console.log(`Sent X notification for ${target.company_name}`);
            }
          } catch (error) {
            console.error(`Error processing X for ${target.company_name}:`, error);
          }
        }
      }
      
      console.log('Scheduled job completed successfully');
    } catch (error) {
      console.error('Scheduled job failed:', error);
      // エラー通知をSlackに送る（将来実装）
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }
    
    if (url.pathname === '/targets' && request.method === 'GET') {
      const targets = await listTargets(env.TARGETS);
      return new Response(JSON.stringify(targets, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
