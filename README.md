# BELO OSAKA アンケートシステム

美容サロン向けのデジタルアンケート収集・分析システムです。

## 機能

### お客様向け機能
- QRコードによるアンケート回答
- モバイルフレンドリーなステップ形式のフォーム
- 直感的で使いやすいUI

### 管理者向け機能
- アンケート回答の閲覧・分析
- 期間別・来店きっかけ別でのフィルタリング
- チャートによるデータ可視化
- 紙アンケートのOCR読み取り機能

## 技術スタック

- **フロントエンド**: Next.js 14 + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **OCR**: Google Cloud Vision API
- **認証**: Cookie-based sessions
- **チャート**: Recharts
- **デプロイ**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example`を`.env.local`にコピーして、実際の値を設定してください。

```bash
cp .env.local.example .env.local
```

必要な環境変数:
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名キー
- `GOOGLE_CLOUD_VISION_API_KEY`: Google Cloud Vision APIキー

### 3. データベースの設定

Supabaseで以下のSQLクエリを実行してテーブルを作成してください:

```sql
-- アンケート回答テーブル
CREATE TABLE questionnaire_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  furigana TEXT,
  name TEXT NOT NULL,
  address TEXT,
  postal_code TEXT,
  phone TEXT,
  birth_year INTEGER,
  birth_month INTEGER,
  birth_day INTEGER,
  age_group INTEGER,
  source_type TEXT,
  instagram_account TEXT,
  referral_person TEXT,
  has_scalp_sensitivity BOOLEAN,
  scalp_sensitivity_details TEXT,
  last_salon_date TEXT,
  last_salon_treatment TEXT,
  past_treatments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OCR画像テーブル
CREATE TABLE ocr_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID REFERENCES questionnaire_responses(id),
  image_url TEXT NOT NULL,
  ocr_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理者テーブル
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security設定
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert questionnaire responses" ON questionnaire_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view questionnaire responses" ON questionnaire_responses
  FOR SELECT USING (auth.role() = 'authenticated');
```

### 4. 管理者アカウントの作成

管理者アカウントを作成するには、パスワードをハッシュ化してデータベースに挿入してください:

```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = bcrypt.hashSync('your_password', 10);
// このハッシュをadmin_usersテーブルに挿入
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## ページ構成

- `/` - ホームページ
- `/questionnaire` - アンケート回答ページ
- `/admin/login` - 管理者ログイン
- `/admin/dashboard` - 管理者ダッシュボード
- `/admin/ocr` - OCR読み取りページ

## デプロイ

### Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。