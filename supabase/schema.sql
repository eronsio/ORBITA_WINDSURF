-- Contacts table for storing user contacts
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  first_name TEXT NOT NULL,
  last_name TEXT DEFAULT '',
  email TEXT,
  
  -- Location
  city TEXT DEFAULT '',
  country TEXT DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Additional info
  birth_year INTEGER,
  bio TEXT,
  photo_url TEXT,
  
  -- Arrays and JSON
  tags TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  
  -- Status: 'active', 'invited', 'unclaimed'
  status TEXT DEFAULT 'active',
  invite_email TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by owner
CREATE INDEX IF NOT EXISTS contacts_owner_user_id_idx ON contacts(owner_user_id);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own contacts
CREATE POLICY "Users can view own contacts"
  ON contacts
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- Policy: Users can insert their own contacts
CREATE POLICY "Users can insert own contacts"
  ON contacts
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- Policy: Users can update their own contacts
CREATE POLICY "Users can update own contacts"
  ON contacts
  FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Policy: Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
  ON contacts
  FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for profile images
-- Run this separately or via Supabase dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars bucket (run after creating bucket)
-- CREATE POLICY "Users can upload own avatars"
--   ON storage.objects
--   FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update own avatars"
--   ON storage.objects
--   FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Anyone can view avatars"
--   ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'avatars');
