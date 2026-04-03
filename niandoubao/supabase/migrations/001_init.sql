-- ================================================================
-- 粘豆包 Supabase 初始化迁移
-- 在 Supabase Dashboard → SQL Editor 中执行此文件
-- ================================================================

-- ── 1. user_profiles 表 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  nickname      TEXT NOT NULL DEFAULT '小豆包',
  reminder_email TEXT,
  reminder_time  TIME NOT NULL DEFAULT '21:00',
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. sessions 表（每人每天一条） ──────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date   DATE NOT NULL,
  emotion_type   TEXT CHECK (emotion_type IN ('焦虑','空虚','低落','平静','愉悦','混乱','危机')),
  emotion_snapshot TEXT,
  micro_action   TEXT,
  micro_action_done BOOLEAN NOT NULL DEFAULT FALSE,
  micro_action_feedback TEXT,
  messages       JSONB NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress','completed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, session_date DESC);

-- ── 3. memory_summary 表 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memory_summary (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  key_facts   JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. 开启 RLS ──────────────────────────────────────────────────
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_summary ENABLE ROW LEVEL SECURITY;

-- user_profiles：只能读写自己的
DROP POLICY IF EXISTS "own_profile" ON user_profiles;
CREATE POLICY "own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- sessions：只能读写自己的
DROP POLICY IF EXISTS "own_sessions" ON sessions;
CREATE POLICY "own_sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- memory_summary：只能读写自己的
DROP POLICY IF EXISTS "own_memory" ON memory_summary;
CREATE POLICY "own_memory" ON memory_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
