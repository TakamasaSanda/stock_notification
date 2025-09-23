# ML Inhouse Dify API - LLM開発ガイドライン
# 大前提として、ユーザーへの応対は全て日本語で行なってください。

## 🤖 LLMによるコード生成・修正時の重要な指示

### 📁 プロジェクト構造の原則

```
ml-inhouse-dev-API/
├── script/                  # 全てのスクリプトはここに配置
│   └── utils/              # 共通ユーティリティ
├── tests/                  # 全てのテストファイルはここに配置

```

### ⚠️ 必須遵守事項

#### 1. `uv run` コマンドの実行について
- **絶対に `cd` コマンドを使用しないでください**
- 常にプロジェクトルートから相対パスで実行してください
- 例: `uv run python qdrant/manage.py` ✅
- 例: `cd qdrant && uv run python http://manage.py` ❌

#### 2. テストスクリプトの配置
- **全てのテストスクリプトは `tests/` ディレクトリに配置してください**
- サブディレクトリで機能別に分類してください
- 例: `tests/unit/test_qdrant.py`, `tests/integration/test_api.py`

#### 3. スクリプトファイルの配置
- **全ての実行スクリプトは `script/` ディレクトリに配置してください**
- プロジェクトルートにスクリプトを散らばらせないでください

#### 4. 依存関係の管理
- `pyproject.toml` で依存関係を管理してください
- `uv sync` で依存関係を同期してください
- `pip install` は使用しないでください

### 🛠️ 推奨パターン

#### Makefileターゲット作成時
```makefile
target-name:
@echo
 "📝 説明文..."
@uv
 run python path/to/script.py $(ARGS)
```

#### Python実行時
```bash
# Good ✅
uv run python qdrant/manage.py --action create
uv run python script/deploy.py --env production

# Bad ❌
cd qdrant && python http://manage.py --action create
pip install -r requirements.txt && python http://script.py
```


- 単体テスト: `tests/unit/test_*.py`
- 統合テスト: `tests/integration/test_*.py`
- フィクスチャ: `tests/fixtures/*.json`

### 📋 チェックリスト

コード生成・修正時は以下をチェックしてください：

- [ ] `cd` コマンドを使用していない
- [ ] `uv run` でPythonを実行している
- [ ] テストは `tests/` ディレクトリに配置
- [ ] スクリプトは `script/` ディレクトリに配置
- [ ] 相対パスでファイルを指定している
- [ ] 依存関係は `pyproject.toml` に記載

### 🚫 禁止事項

- `cd` コマンドの使用
- プロジェクトルート以外でのスクリプト配置
- `pip install` の直接使用
- 絶対パスの使用（環境変数やテンプレート以外）
- テストファイルの散在配置

---

**このガイドラインに従うことで、プロジェクトの一貫性と保守性が向上します。**

