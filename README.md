# Stock Notification System

企業のPRやX（Twitter）の更新を監視し、LINE/Discordに通知するシステムです。
Cloudflare Workersを使用してSaaS化を見据えた設計になっています。

## 機能

- **PR監視**: 企業のRSSフィードから最新のPR情報を取得
- **X監視**: X（Twitter）のRSSフィードから最新の投稿を取得
- **LINE通知**: 新着情報をLINEにプッシュ通知
- **GitHub中心運用**: 設定変更はGitHubのPRで管理
- **自動デプロイ**: CI/CDでCloudflare Workersに自動デプロイ

## アーキテクチャ

```
GitHub Repo (code + config/targets.csv)
    ↓ (CI/CD)
Cloudflare Workers (Cron 5-15分間隔)
    ↓ (監視)
企業PR RSS / X RSS
    ↓ (通知)
LINE Messaging API / Discord Webhooks
```

## セットアップ手順

### 1. 前提条件

- Cloudflareアカウント
- LINE Developersアカウント
- GitHubアカウント

### 2. Cloudflare設定

#### KV名前空間の作成

```bash
# targets用のKV名前空間
wrangler kv:namespace create "TARGETS"
wrangler kv:namespace create "TARGETS" --preview

# state用のKV名前空間
wrangler kv:namespace create "STATE"
wrangler kv:namespace create "STATE" --preview
```

#### D1データベースの作成（将来のSaaS化用）

```bash
wrangler d1 create stock_notification
```

#### wrangler.tomlの更新

作成したKV名前空間とD1データベースのIDを`wrangler.toml`に設定してください。

### 3. LINE設定（新仕様）

1. LINE公式アカウントを作成
2. LINE Official Account Managerで「Messaging APIを有効化」
3. チャネルアクセストークン（Channel access token）を取得
4. 友だち追加用のQRコードでLINE公式アカウントを友だち追加
5. ユーザーIDを取得

### 4. GitHub Secrets設定

以下のSecretsをGitHubリポジトリに設定してください：

- `CLOUDFLARE_API_TOKEN`: Cloudflare APIトークン
- `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID
- `LINE_CHANNEL_TOKEN`: LINE Messaging APIのチャネルアクセストークン

### 4. Discord設定（任意・複数宛先可）

1. DiscordサーバでWebhookを作成（チャンネルごと）
2. `config/sinks.csv`に以下の形式で登録

```csv
tenant_id,type,enabled,config_json
demo,discord,true,"{\"webhook_urls\":[\"https://discord.com/api/webhooks/xxx\"]}"
```

3. 上記CSVをKVに反映（例: CIで`wrangler kv:key put --binding=TARGETS sinks:active @config/sinks.json`）

### 5. 監視対象の設定

`config/targets.csv`を編集して監視対象企業を設定してください：

```csv
tenant_id,company_name,pr_url,twitter_id,x_feed_url,line_user_id,enabled
demo,トヨタ,https://global.toyota/jp/newsroom/rss.xml,@Toyota_PR,,Uxxxxxxxxxxxxxxx,true
```

### 6. 設定のアップロード

CSVファイルをCloudflare KVにアップロード：

```bash
# PythonスクリプトでCSV→JSON変換＋KVアップロード
python scripts/upload_config.py

# ドライラン（実際にはアップロードしない）
python scripts/upload_config.py --dry-run

# 個別アップロード
python scripts/upload_config.py --targets-only
python scripts/upload_config.py --sinks-only
```

### 7. デプロイ

```bash
# 依存関係のインストール
npm install

# ローカル開発
npm run dev

# 本番デプロイ
npm run deploy
```

## 開発

### ローカル開発

```bash
npm run dev
```

### CSV検証

```bash
npm run validate
```

### 型チェック

```bash
npx tsc --noEmit
```

## 運用

### 監視対象の追加・変更

1. `config/targets.csv`を編集
2. GitHubでPRを作成
3. CIで自動検証
4. マージで自動デプロイ

### ログ確認

Cloudflare Workers Dashboardでログを確認できます。

### 障害対応

- 失敗したリクエストは指数バックオフでリトライ
- レート制限対応済み
- エラーログはWorkers Analyticsで確認可能

## SaaS化への道筋

### 現在の構成（MVP）

- 個人利用・小規模顧客向け
- Cloudflare無料枠内で運用可能
- LINE無料枠（月1,000通）内で運用

### 将来の拡張

1. **マルチテナント対応**
   - D1データベースで顧客管理
   - 顧客ごとの設定分離

2. **通知先の拡張**
   - Slack Incoming Webhook
   - メール送信（SendGrid等）

3. **Xの正式対応**
   - 顧客BYOのX APIキー
   - RSSプロキシの継続サポート

4. **多ソース対応**
   - note, PR TIMES, YouTube Community等

## コスト見積もり

### MVP段階（個人利用）
- Cloudflare: 無料枠内（¥0）
- LINE: 無料枠内（¥0）
- **合計: ¥0/月**

### 小規模SaaS（数顧客）
- Cloudflare Workers Paid: $5/月
- LINE公式アカウント: ¥5,000/月
- **合計: 約¥6,000/月**

### 本格SaaS（数十顧客〜）
- Cloudflare: 従量課金
- LINE: 顧客BYO推奨
- X: 顧客BYO API（$200/月/顧客）
- **合計: 変動（顧客BYOで固定費削減）**

## ライセンス

MIT License

# 特定の企業のPRと、ツイッターのそのアカウントの投稿の、２つについてを通知でわかる様にしたいです。この２つは、今後増える可能性はあります。
## 通知先は、slack、LINE、メールを選べる様にしたいです。ただし、まずはLINEのみでいいです

### 上記は、将来的にはSaaSで提供したいです。ただし、まずは個人利用規模で出来る範囲内でほぼ無料くらいで考えています。
#### SaaSとして提供する際は、顧客毎にどの企業の情報が知りたいかのリストを埋めて貰う（①企業のURL,TwitterのIDの2行）
##### 上記が全て埋まっていることを確認した上で、各クライアント毎の通知先の設定

