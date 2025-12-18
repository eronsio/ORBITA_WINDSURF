-- Groups and Chat schema for Orbita
-- Run this in Supabase SQL Editor after the main schema

-- ============================================
-- GROUPS TABLE
-- User-defined groups for organizing contacts
-- ============================================

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',  -- Accent color for the group
  icon TEXT,                      -- Optional emoji or icon identifier
  description TEXT,
  
  -- Ordering for user's group list
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS groups_owner_user_id_idx ON groups(owner_user_id);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own groups"
  ON groups FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own groups"
  ON groups FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own groups"
  ON groups FOR DELETE
  USING (auth.uid() = owner_user_id);

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CONTACT_GROUPS JUNCTION TABLE
-- Many-to-many relationship between contacts and groups
-- ============================================

CREATE TABLE IF NOT EXISTS contact_groups (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, group_id)
);

CREATE INDEX IF NOT EXISTS contact_groups_contact_idx ON contact_groups(contact_id);
CREATE INDEX IF NOT EXISTS contact_groups_group_idx ON contact_groups(group_id);

ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;

-- Users can manage contact_groups if they own both the contact and group
CREATE POLICY "Users can view own contact_groups"
  ON contact_groups FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND owner_user_id = auth.uid())
  );

CREATE POLICY "Users can insert own contact_groups"
  ON contact_groups FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND owner_user_id = auth.uid()) AND
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_user_id = auth.uid())
  );

CREATE POLICY "Users can delete own contact_groups"
  ON contact_groups FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND owner_user_id = auth.uid())
  );

-- ============================================
-- CONVERSATIONS TABLE
-- 1:1 conversations between users
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants (always 2 for 1:1)
  participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Last activity for sorting
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique conversation per pair
  CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2),
  CONSTRAINT different_participants CHECK (participant_1 != participant_2)
);

CREATE INDEX IF NOT EXISTS conversations_participant_1_idx ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS conversations_participant_2_idx ON conversations(participant_2);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can insert conversations they participate in"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- ============================================
-- MESSAGES TABLE
-- Individual messages within conversations
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  -- Read status
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- ============================================
-- FUNCTION: Update conversation on new message
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- FUNCTION: Get or create conversation
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  user_1 UUID;
  user_2 UUID;
BEGIN
  -- Normalize order (smaller UUID first)
  IF auth.uid() < other_user_id THEN
    user_1 := auth.uid();
    user_2 := other_user_id;
  ELSE
    user_1 := other_user_id;
    user_2 := auth.uid();
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM conversations
  WHERE participant_1 = user_1 AND participant_2 = user_2;
  
  -- Create if not exists
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2)
    VALUES (user_1, user_2)
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
