-- Fix the malformed RLS policy for server_channels with correct column names
-- Your schema uses 'profile_id' not 'user_id'

-- Drop the malformed policy
DROP POLICY IF EXISTS "Server channels are viewable by server members" ON server_channels;

-- Create the corrected policy with proper column name
CREATE POLICY "Server channels are viewable by server members" ON server_channels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM server_members WHERE server_id = server_channels.server_id AND profile_id = auth.uid())
  );

-- Also fix any other policies that might have the wrong column name
DROP POLICY IF EXISTS "Server members are viewable by server members" ON server_members;
CREATE POLICY "Server members are viewable by server members" ON server_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM server_members sm WHERE sm.server_id = server_members.server_id AND sm.profile_id = auth.uid())
  );

-- Check if UPDATE policy exists for server_messages and create with correct column names
DROP POLICY IF EXISTS "Server members can update messages" ON server_messages;
CREATE POLICY "Server members can update messages" ON server_messages
  FOR UPDATE USING (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = server_messages.channel_id AND sm.profile_id = auth.uid()
    )
  );

-- Check if DELETE policy exists for server_messages and create with correct column names
DROP POLICY IF EXISTS "Server members can delete own messages" ON server_messages;
CREATE POLICY "Server members can delete own messages" ON server_messages
  FOR DELETE USING (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = server_messages.channel_id AND sm.profile_id = auth.uid()
    )
  );

-- Fix any other policies that might reference user_id instead of profile_id
DROP POLICY IF EXISTS "Users can join servers" ON server_members;
CREATE POLICY "Users can join servers" ON server_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can leave servers" ON server_members;
CREATE POLICY "Users can leave servers" ON server_members
  FOR DELETE USING (auth.uid() = profile_id);
