-- VOID Extension - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector for embeddings (if available)
CREATE EXTENSION IF NOT EXISTS vector;

-- Memory Changes Table (for federated sync)
CREATE TABLE IF NOT EXISTS memory_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'message', 'hierarchy', 'causality', etc.
    data JSONB NOT NULL, -- Encrypted payload
    timestamp BIGINT NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memory_changes_user_id ON memory_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_changes_timestamp ON memory_changes(timestamp);
CREATE INDEX IF NOT EXISTS idx_memory_changes_device_id ON memory_changes(device_id);
CREATE INDEX IF NOT EXISTS idx_memory_changes_type ON memory_changes(type);

-- Row Level Security
ALTER TABLE memory_changes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own changes
DROP POLICY IF EXISTS "Users can view own memory changes" ON memory_changes;
CREATE POLICY "Users can view own memory changes"
    ON memory_changes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own memory changes" ON memory_changes;
CREATE POLICY "Users can insert own memory changes"
    ON memory_changes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own memory changes" ON memory_changes;
CREATE POLICY "Users can update own memory changes"
    ON memory_changes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own memory changes" ON memory_changes;
CREATE POLICY "Users can delete own memory changes"
    ON memory_changes FOR DELETE
    USING (auth.uid() = user_id);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    encryption_salt TEXT, -- For key derivation
    sync_enabled BOOLEAN DEFAULT false,
    last_sync BIGINT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
    ON user_settings FOR ALL
    USING (auth.uid() = user_id);

-- Message Statistics Table (for analytics)
CREATE TABLE IF NOT EXISTS message_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    platform TEXT NOT NULL, -- 'chatgpt', 'claude', etc.
    message_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    query_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date, platform)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_stats_user_id ON message_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_message_stats_date ON message_stats(date);

-- Row Level Security
ALTER TABLE message_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON message_stats;
CREATE POLICY "Users can view own stats"
    ON message_stats FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own stats" ON message_stats;
CREATE POLICY "Users can insert own stats"
    ON message_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stats" ON message_stats;
CREATE POLICY "Users can update own stats"
    ON message_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean old memory changes (run periodically)
CREATE OR REPLACE FUNCTION clean_old_memory_changes()
RETURNS void AS $$
BEGIN
    -- Delete changes older than 90 days
    DELETE FROM memory_changes
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime for memory_changes table
-- (Run this in Supabase Dashboard under Database > Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE memory_changes;

-- Grant permissions
GRANT ALL ON memory_changes TO authenticated;
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON message_stats TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'VOID database schema created successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Enable Realtime for memory_changes table in Supabase Dashboard';
    RAISE NOTICE '2. Set up a cron job to run clean_old_memory_changes() periodically';
    RAISE NOTICE '3. Configure your extension with Supabase URL and anon key';
END $$;
