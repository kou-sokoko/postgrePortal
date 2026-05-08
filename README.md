# PostgreSQL 管理ポータル

PostgreSQLの接続・管理・クエリ実行ができるWebポータルアプリケーション。

## 概要

ブラウザからPostgreSQLに接続し、データベース・スキーマ・テーブルの管理およびSQLクエリの実行を行うためのローカル向けWebツール。

### 主な機能

- PostgreSQL接続（HOST / Database / User / Password / Port）
- データベース・スキーマ・テーブルのツリー表示
- データベース / スキーマ / テーブルの作成・削除
- SQLクエリの実行と結果表示

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React + TypeScript + Material-UI (MUI) + Tailwind CSS (Vite) |
| バックエンド | FastAPI + Python |
| DB接続 | psycopg2 |
| テスト (FE) | Vitest + React Testing Library |
| テスト (BE) | pytest + httpx |
| UIテスト | Playwright |

## ディレクトリ構成

```
posgre_portal/
├── frontend/          # React + TypeScript フロントエンド
│   ├── src/
│   └── package.json
└── backend/           # FastAPI バックエンド
     ├── app/
     ├── tests/
     └── requirements.txt
```

## セットアップ

### 前提条件

- Node.js 18 以上
- Python 3.10 以上
- PostgreSQL（`localhost:5432` でアクセス可能であること）

### バックエンド

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

または `start.bat` を実行する。

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173/posgre/` を開く。

### IIS で配信する場合（本番）

#### 前提条件

- IIS に **URL Rewrite モジュール** がインストール済みであること
- IIS に **Application Request Routing (ARR)** がインストール済みで、**プロキシ機能が有効** であること  
  （IIS マネージャー → Application Request Routing Cache → Server Proxy Settings → Enable proxy をオン）

#### ビルド

```bash
cd frontend
npm run build
```

`frontend/dist/` に成果物が出力される。

#### IIS への配置

1. `frontend/dist/` の内容を IIS の物理パスへコピーする
2. IIS サイトの仮想ディレクトリ `/posgre` をその物理パスに向ける（または `/posgre/` のアプリケーションとして登録する）
3. アクセスURL: `http://localhost/posgre/`

> `vite.config.ts` に `base: '/posgre/'` が設定されているため、必ず `/posgre/` 配下に配置すること。

#### `web.config` の配置（必須）

IIS は `/api/*` リクエストを FastAPI（ポート8000）へ転送しないため、`dist/` 直下に以下の `web.config` を配置する。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:8000/api/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

#### バックエンドの起動

IIS は FastAPI をホストしない。別途バックエンドを起動しておくこと（「バックエンド」節を参照）。

## 接続情報のデフォルト値

| フィールド | デフォルト値 |
|-----------|------------|
| HOST | `localhost` |
| Database | `postgres` |
| User | `postgres` |
| Port | `5432` |

## 注意事項

- 認証なし、ローカル環境専用のツールです
- 外部サービス・クラウドへの接続は不要です
- レスポンシブ対応はしていません
