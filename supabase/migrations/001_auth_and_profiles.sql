-- Migration: 001_auth_and_profiles
-- Description: Set up auth email validation trigger and profiles table for user onboarding
-- Created: 2026-01-29

-- ============================================
-- TABLE: profiles
-- Stores user onboarding data and daily targets
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    daily_calories_target INTEGER NOT NULL DEFAULT 2000,
    daily_protein_target INTEGER NOT NULL DEFAULT 50,
    daily_carbs_target INTEGER NOT NULL DEFAULT 250,
    daily_fat_target INTEGER NOT NULL DEFAULT 65,
    dietary_preferences TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_incomplete 
    ON profiles(id) WHERE onboarding_completed = FALSE;

-- ============================================
-- FUNCTION: Validate UNC email domain
-- Only allows @unc.edu and @ad.unc.edu emails
-- ============================================
CREATE OR REPLACE FUNCTION validate_unc_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email IS NULL THEN
        RAISE EXCEPTION 'Email is required';
    END IF;
    
    -- Normalize email to lowercase for comparison
    IF NOT (
        LOWER(NEW.email) LIKE '%@unc.edu' OR 
        LOWER(NEW.email) LIKE '%@ad.unc.edu'
    ) THEN
        RAISE EXCEPTION 'Only @unc.edu and @ad.unc.edu email addresses are allowed for registration';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Validate email before user signup
-- Note: This trigger on auth.users requires Supabase dashboard configuration
-- or running this migration with elevated privileges
-- ============================================
DROP TRIGGER IF EXISTS validate_email_before_signup ON auth.users;
CREATE TRIGGER validate_email_before_signup
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION validate_unc_email();

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- Creates a profiles record when a new user signs up
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, onboarding_completed)
    VALUES (NEW.id, NEW.email, FALSE)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Create profile after user signup
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY: profiles
-- Users can only access their own profile
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Profile is created automatically via trigger (service role)
-- No INSERT policy needed for users since it's handled by the trigger
CREATE POLICY "Service role can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- Grant permissions
-- ============================================
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT INSERT ON profiles TO service_role;
