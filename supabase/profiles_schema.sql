-- Profiles table for user discovery
-- Run this in Supabase SQL Editor AFTER the main schema.sql

-- Create profiles table for discoverable users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info (user fills this out)
  display_name TEXT NOT NULL,
  email TEXT,
  
  -- Location
  city TEXT DEFAULT '',
  country TEXT DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Additional info
  bio TEXT,
  photo_url TEXT,
  
  -- Arrays
  tags TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '[]',
  
  -- Discovery settings
  is_discoverable BOOLEAN DEFAULT true,  -- Can others find this user?
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view discoverable profiles
CREATE POLICY "Anyone can view discoverable profiles"
  ON profiles
  FOR SELECT
  USING (is_discoverable = true OR auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
