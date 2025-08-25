-- Final fix for real-time authentication issues
-- The Error 401 suggests RLS policies aren't working correctly

-- First, let's check if the policies are matching the right table structure
-- Drop and recreate policies with the exact correct structure

DROP POLICY IF EXISTS "Server messages are viewable by server members" ON server_messages;
DROP POLICY IF EXISTS "Server members can send messages" ON server_messages;
DROP POLICY IF EXISTS "Server members can update messages" ON server_messages;
DROP POLICY IF EXISTS "Server members can delete own messages" ON server_messages;

-- Create policies that match your current Prisma schema exactly
CREATE POLICY "Server messages are viewable by server members" ON server_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = server_messages.channel_id AND sm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Server members can send messages" ON server_messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid()::text = author_id AND
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = channel_id AND sm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Server members can update own messages" ON server_messages
  FOR UPDATE USING (
    auth.uid()::text = author_id AND
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = server_messages.channel_id AND sm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Server members can delete own messages" ON server_messages
  FOR DELETE USING (
    auth.uid()::text = author_id AND
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = server_messages.channel_id AND sm.profile_id = auth.uid()
    )
  );

-- Also make sure the server_members table has the right policies
DROP POLICY IF EXISTS "Server members are viewable by server members" ON server_members;
CREATE POLICY "Server members are viewable by server members" ON server_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM server_members sm WHERE sm.server_id = server_members.server_id AND sm.profile_id = auth.uid())
  );

-- And server_channels
DROP POLICY IF EXISTS "Server channels are viewable by server members" ON server_channels;
CREATE POLICY "Server channels are viewable by server members" ON server_channels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM server_members WHERE server_id = server_channels.server_id AND profile_id = auth.uid())
  );
