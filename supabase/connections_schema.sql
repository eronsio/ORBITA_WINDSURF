-- Connections schema - tracks who knows whom among contacts
-- This creates a bidirectional relationship between contacts

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id_1 UUID NOT NULL,
  contact_id_2 UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Ensure we don't have duplicate connections (either direction)
  UNIQUE(user_id, contact_id_1, contact_id_2)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_connections_user ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_contact1 ON connections(contact_id_1);
CREATE INDEX IF NOT EXISTS idx_connections_contact2 ON connections(contact_id_2);

-- RLS policies
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own connections
CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own connections
CREATE POLICY "Users can create own connections"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get all connections for a user as a map
CREATE OR REPLACE FUNCTION get_connections_map()
RETURNS TABLE(contact_id UUID, connected_ids UUID[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH all_connections AS (
    SELECT contact_id_1 as cid, contact_id_2 as connected
    FROM connections
    WHERE user_id = auth.uid()
    UNION ALL
    SELECT contact_id_2 as cid, contact_id_1 as connected
    FROM connections
    WHERE user_id = auth.uid()
  )
  SELECT cid as contact_id, array_agg(connected) as connected_ids
  FROM all_connections
  GROUP BY cid;
END;
$$;
