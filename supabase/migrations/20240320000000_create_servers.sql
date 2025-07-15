-- Create servers table
CREATE TABLE servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  invite_code VARCHAR(20) UNIQUE,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_roles table
CREATE TABLE server_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7), -- hex color code
  permissions JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_members table
CREATE TABLE server_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES server_roles(id) ON DELETE SET NULL,
  nickname VARCHAR(50),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT false,
  banned_until TIMESTAMP WITH TIME ZONE,
  UNIQUE(server_id, user_id)
);

-- Create server_channels table  
CREATE TABLE server_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'announcement', 'general'
  position INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES server_channels(id) ON DELETE CASCADE, -- for categories
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_posts table
CREATE TABLE server_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES server_channels(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[],
  anime_id UUID, -- Reference to anime if post is about specific anime
  is_pinned BOOLEAN DEFAULT false,
  is_announcement BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES server_posts(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_messages table (for real-time chat)
CREATE TABLE server_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES server_channels(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'system'
  reply_to_id UUID REFERENCES server_messages(id) ON DELETE CASCADE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_post_likes table
CREATE TABLE server_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES server_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_servers_owner_id ON servers(owner_id);
CREATE INDEX idx_servers_invite_code ON servers(invite_code);
CREATE INDEX idx_server_members_server_id ON server_members(server_id);
CREATE INDEX idx_server_members_user_id ON server_members(user_id);
CREATE INDEX idx_server_channels_server_id ON server_channels(server_id);
CREATE INDEX idx_server_posts_channel_id ON server_posts(channel_id);
CREATE INDEX idx_server_posts_author_id ON server_posts(author_id);
CREATE INDEX idx_server_messages_channel_id ON server_messages(channel_id);
CREATE INDEX idx_server_messages_created_at ON server_messages(created_at DESC);
CREATE INDEX idx_server_post_likes_post_id ON server_post_likes(post_id);

-- Enable RLS (Row Level Security)
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for servers
CREATE POLICY "Public servers are viewable by everyone" ON servers
  FOR SELECT USING (is_public = true);

CREATE POLICY "Server members can view their servers" ON servers
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM server_members WHERE server_id = servers.id AND user_id = auth.uid())
  );

CREATE POLICY "Only authenticated users can create servers" ON servers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);

CREATE POLICY "Only server owners can update servers" ON servers
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Only server owners can delete servers" ON servers
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for server_members
CREATE POLICY "Server members are viewable by server members" ON server_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM server_members sm WHERE sm.server_id = server_members.server_id AND sm.user_id = auth.uid())
  );

CREATE POLICY "Users can join servers" ON server_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can leave servers" ON server_members
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for server_channels
CREATE POLICY "Server channels are viewable by server members" ON server_channels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM server_members WHERE server_id = server_channels.server_id AND user_id = auth.uid())
  );

-- RLS Policies for server_posts
CREATE POLICY "Server posts are viewable by server members" ON server_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = server_posts.channel_id AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server members can create posts" ON server_posts
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = channel_id AND sm.user_id = auth.uid()
    )
  );

-- RLS Policies for server_messages
CREATE POLICY "Server messages are viewable by server members" ON server_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = server_messages.channel_id AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server members can send messages" ON server_messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM server_channels sc
      JOIN server_members sm ON sc.server_id = sm.server_id
      WHERE sc.id = channel_id AND sm.user_id = auth.uid()
    )
  );

-- Functions for updating member count
CREATE OR REPLACE FUNCTION update_server_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE servers 
    SET member_count = member_count + 1
    WHERE id = NEW.server_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE servers 
    SET member_count = member_count - 1
    WHERE id = OLD.server_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_server_member_count_trigger
  AFTER INSERT OR DELETE ON server_members
  FOR EACH ROW EXECUTE FUNCTION update_server_member_count();

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars VARCHAR(62) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result VARCHAR(20) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to increment post likes
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE server_posts 
  SET like_count = like_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement post likes
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE server_posts 
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update reply count
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reply_to_id IS NOT NULL THEN
    UPDATE server_posts 
    SET reply_count = reply_count + 1
    WHERE id = NEW.reply_to_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reply_to_id IS NOT NULL THEN
    UPDATE server_posts 
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.reply_to_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reply count
CREATE TRIGGER update_reply_count_trigger
  AFTER INSERT OR DELETE ON server_posts
  FOR EACH ROW EXECUTE FUNCTION update_reply_count(); 