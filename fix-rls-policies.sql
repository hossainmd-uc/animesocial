-- Fix the malformed RLS policy for server_channels
-- This is causing real-time subscription failures

-- Drop the malformed policy
DROP POLICY IF EXISTS "Server channels are viewable by server members" ON server_channels;

-- Create the corrected policy
CREATE POLICY "Server channels are viewable by server members" ON server_channels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM server_members WHERE server_id = server_channels.server_id AND user_id = auth.uid())
  );

-- Also ensure we have proper policies for real-time subscriptions
-- Add UPDATE and DELETE policies for server_messages if they don't exist

-- Check if UPDATE policy exists for server_messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'server_messages' 
        AND policyname = 'Server members can update messages'
    ) THEN
        CREATE POLICY "Server members can update messages" ON server_messages
          FOR UPDATE USING (
            auth.uid() = author_id AND
            EXISTS (
              SELECT 1 FROM server_channels sc
              JOIN server_members sm ON sc.server_id = sm.server_id
              WHERE sc.id = server_messages.channel_id AND sm.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Check if DELETE policy exists for server_messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'server_messages' 
        AND policyname = 'Server members can delete own messages'
    ) THEN
        CREATE POLICY "Server members can delete own messages" ON server_messages
          FOR DELETE USING (
            auth.uid() = author_id AND
            EXISTS (
              SELECT 1 FROM server_channels sc
              JOIN server_members sm ON sc.server_id = sm.server_id
              WHERE sc.id = server_messages.channel_id AND sm.user_id = auth.uid()
            )
          );
    END IF;
END $$;
