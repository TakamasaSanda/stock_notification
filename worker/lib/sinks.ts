export type SinkType = 'discord' | 'line';

export interface SinkRow {
  tenant_id: string;
  type: SinkType;
  enabled: boolean;
  config_json: string; // JSON string
}

export interface SinkConfigBase {
  type: SinkType;
  enabled: boolean;
  tenant_id: string;
  config: any;
}

export async function listSinks(kv: KVNamespace): Promise<SinkConfigBase[]> {
  try {
    const data = await kv.get('sinks:active', 'json');
    if (!data) {
      console.warn('No sinks found in KV store');
      return [];
    }
    const rows = data as SinkRow[];
    return rows
      .filter(r => r.enabled)
      .map(r => ({
        type: r.type,
        enabled: r.enabled,
        tenant_id: r.tenant_id,
        config: safeParseJson(r.config_json),
      }));
  } catch (error) {
    console.error('Error loading sinks from KV:', error);
    return [];
  }
}

function safeParseJson(s: string): any {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}


