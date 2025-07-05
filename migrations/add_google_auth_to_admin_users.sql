-- admin_usersテーブルにGoogle認証用のカラムを追加
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS google_email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- roleのチェック制約を追加
ALTER TABLE admin_users 
ADD CONSTRAINT admin_role_check CHECK (role IN ('master', 'admin'));

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_admin_users_google_email ON admin_users(google_email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- 既存データの更新（必要に応じて）
UPDATE admin_users 
SET role = 'admin', 
    is_active = true 
WHERE role IS NULL;