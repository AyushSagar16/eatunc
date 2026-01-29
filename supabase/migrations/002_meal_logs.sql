-- Migration: 002_meal_logs
-- Description: Create meal_logs and meal_log_items tables for tracking daily meals
-- Created: 2026-01-29

-- ============================================
-- TABLE: meal_logs
-- Parent table for daily meal entries
-- ============================================
CREATE TABLE IF NOT EXISTS meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, log_date DESC);

-- ============================================
-- TABLE: meal_log_items
-- Individual food items within a meal log
-- ============================================
CREATE TABLE IF NOT EXISTS meal_log_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
    recipe_number INTEGER NOT NULL,
    servings DECIMAL(4,2) NOT NULL DEFAULT 1.0 CHECK (servings > 0),
    -- Denormalized for historical accuracy (menu items may change)
    food_name TEXT NOT NULL,
    calories_per_serving INTEGER NOT NULL,
    protein_per_serving DECIMAL(6,2) NOT NULL,
    carbs_per_serving DECIMAL(6,2) NOT NULL,
    fat_per_serving DECIMAL(6,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for meal item queries
CREATE INDEX IF NOT EXISTS idx_meal_log_items_meal ON meal_log_items(meal_log_id);

-- ============================================
-- Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_meal_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_meal_logs_updated_at ON meal_logs;
CREATE TRIGGER update_meal_logs_updated_at
    BEFORE UPDATE ON meal_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_logs_updated_at();

-- ============================================
-- ROW LEVEL SECURITY: meal_logs
-- ============================================
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal logs"
    ON meal_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
    ON meal_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
    ON meal_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
    ON meal_logs FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- ROW LEVEL SECURITY: meal_log_items
-- ============================================
ALTER TABLE meal_log_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal log items"
    ON meal_log_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM meal_logs 
            WHERE meal_logs.id = meal_log_items.meal_log_id 
            AND meal_logs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own meal log items"
    ON meal_log_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_logs 
            WHERE meal_logs.id = meal_log_items.meal_log_id 
            AND meal_logs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own meal log items"
    ON meal_log_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM meal_logs 
            WHERE meal_logs.id = meal_log_items.meal_log_id 
            AND meal_logs.user_id = auth.uid()
        )
    );

-- ============================================
-- Grant permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_logs TO authenticated;
GRANT SELECT, INSERT, DELETE ON meal_log_items TO authenticated;
