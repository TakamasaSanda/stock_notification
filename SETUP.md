# セットアップガイド

このガイドでは、Stock Notification Systemの初期セットアップ手順を詳しく説明します。

## 1. 前提条件の準備

### Cloudflareアカウント
1. [Cloudflare](https://cloudflare.com)でアカウントを作成
2. ダッシュボードでアカウントIDを確認

### LINE Developersアカウント
1. [LINE Developers Console](https://developers.line.biz/)でアカウントを作成
2. 新しいプロジェクトを作成
3. Messaging APIチャネルを作成
4. チャネルアクセストークンを取得
5. 友だち追加用のQRコードでLINE公式アカウントを友だち追加
6. ユーザーIDを取得（Webhook URLにPOSTして確認）

## 2. Cloudflare設定

### Wranglerのインストール
```bash
npm install -g wrangler
```

### ログイン
```bash
wrangler login
```

### KV名前空間の作成
```bash
# targets用のKV名前空間
wrangler kv:namespace create "TARGETS"
wrangler kv:namespace create "TARGETS" --preview

# state用のKV名前空間
wrangler kv:namespace create "STATE"
wrangler kv:namespace create "STATE" --preview
```

### D1データベースの作成（将来のSaaS化用）
```bash
wrangler d1 create stock_notification
```

### wrangler.tomlの更新
作成したKV名前空間とD1データベースのIDを`wrangler.toml`に設定してください。

## 3. GitHub設定

### リポジトリの作成
1. GitHubで新しいリポジトリを作成
2. このコードをプッシュ

### Secretsの設定
リポジトリのSettings > Secrets and variables > Actionsで以下を設定：

- `CLOUDFLARE_API_TOKEN`: Cloudflare APIトークン
- `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID
- `LINE_CHANNEL_TOKEN`: LINE Messaging APIのチャネルアクセストークン

### APIトークンの作成
1. Cloudflareダッシュボード > My Profile > API Tokens
2. "Create Token" > "Custom token"
3. 以下の権限を設定：
   - Account: Cloudflare Workers:Edit
   - Zone: Zone:Read
   - Zone: Zone Settings:Read

## 4. 監視対象の設定

### targets.csvの編集
`config/targets.csv`を編集して監視対象企業を設定：

```csv
tenant_id,company_name,pr_url,twitter_id,x_feed_url,line_user_id,enabled
demo,トヨタ,https://global.toyota/jp/newsroom/rss.xml,@Toyota_PR,,Uxxxxxxxxxxxxxxx,true
demo,ソニー,https://www.sony.com/ja/SonyInfo/News/,@Sony,,Uxxxxxxxxxxxxxxx,true
```

### LINE User IDの取得方法
1. LINE公式アカウントを友だち追加
2. 以下のWebhook URLを設定（一時的）：
   ```
   https://your-domain.com/webhook
   ```
3. メッセージを送信してWebhookでユーザーIDを確認
4. または、LINE Developers ConsoleのMessaging API設定で確認

## 5. デプロイ

### 依存関係のインストール
```bash
npm install
```

### ローカル開発
```bash
npm run dev
```

### 本番デプロイ
```bash
npm run deploy
```

## 6. 動作確認

### 手動実行
```bash
# Workerを手動実行（Cronトリガーをテスト）
wrangler dev --local
```

### ログ確認
Cloudflare Workers Dashboardでログを確認：
1. Workers & Pages > あなたのWorker
2. Logs タブで実行ログを確認

### 通知テスト
1. 監視対象企業のRSSフィードに新しい記事があるか確認
2. 10分以内にLINEに通知が届くか確認

## 7. トラブルシューティング

### よくある問題

#### KV名前空間が見つからない
- `wrangler.toml`のIDが正しいか確認
- プレビュー環境と本番環境のIDを混同していないか確認

#### LINE通知が届かない
- チャネルアクセストークンが正しいか確認
- ユーザーIDが正しいか確認
- LINE公式アカウントを友だち追加しているか確認

#### RSSフィードが取得できない
- URLが正しいか確認
- RSSフィードが公開されているか確認
- レート制限に引っかかっていないか確認

### ログの確認方法
```bash
# リアルタイムログ
wrangler tail

# 特定の時間のログ
wrangler tail --since 2024-01-01T00:00:00Z
```

## 8. 次のステップ

### 監視対象の追加
1. `config/targets.csv`に新しい企業を追加
2. GitHubでPRを作成
3. CIで自動検証
4. マージで自動デプロイ

### 通知先の追加
将来的にSlackやメール通知を追加する場合は、`worker/sinks/`ディレクトリに新しいシンクを追加してください。

### SaaS化への準備
- D1データベースのスキーマ設計
- マルチテナント対応
- 顧客管理機能の追加
