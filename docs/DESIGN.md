# Design Philosophy

- Multi-tenant by design: `tenant_id` drives isolation.
- Sources and Sinks are pluggable modules (`worker/adapters/*`, `worker/sinks/*`).
- Configuration is GitOps-friendly via CSV → KV (`targets:active`, `sinks:active`).
- Cost-first: use free tiers (Cloudflare Workers, LINE OA free, Discord webhooks); reduce pushes via dedupe/digest.
- Compliance: LINE 2024-09-04 change (OA → enable Messaging API in OA Manager).

## Data

- `targets.csv` → KV `targets:active`: monitored sources per tenant.
- `sinks.csv` → KV `sinks:active`: destinations per tenant; multiple endpoints per tenant.

## Sinks

- LINE: push per `line_user_id` if present on target.
- Discord: broadcast to all enabled webhooks for the tenant.
- Extensible: add Slack/Email as additional sinks.

## Flow

1. Cron triggers worker.
2. Load `targets` and `sinks` from KV.
3. For each target, fetch latest (PR, X-RSS) and check dedupe.
4. If new, compose message and fan-out to sinks for that tenant.
5. Persist last seen ID.

## Future

- Digest batching per tenant/sink.
- D1-backed admin UI for CRUD.
- Per-sink rate limiting; richer templates.

