export interface Server {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  owner_id: string;
  is_public: boolean;
  invite_code?: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface ServerRole {
  id: string;
  server_id: string;
  name: string;
  color?: string;
  permissions: Record<string, boolean>;
  position: number;
  is_default: boolean;
  created_at: string;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role_id?: string;
  nickname?: string;
  joined_at: string;
  is_banned: boolean;
  banned_until?: string;
  // Joined user data
  user?: {
    id: string;
    username?: string;
    avatar_url?: string;
    full_name?: string;
  };
  role?: ServerRole;
}

export interface ServerChannel {
  id: string;
  server_id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'announcement' | 'general' | 'category' | 'chat' | 'post';
  position: number;
  is_private: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  // Nested channels for categories
  children?: ServerChannel[];
}

export interface ServerPost {
  id: string;
  server_id: string;
  channel_id: string;
  author_id: string;
  title?: string;
  content: string;
  image_url?: string;
  anime_id?: string;
  parent_id?: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  channel?: ServerChannel;
  replies?: ServerPost[];
  parent_post?: ServerPost;
  anime?: {
    id: string;
    title: string;
    image_url?: string;
  };
  is_liked?: boolean;
}

export interface ServerMessage {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  reply_to_id?: string;
  parent_id?: string;
  edited_at?: string;
  updated_at?: string;
  created_at: string;
  like_count?: number;
  reply_count?: number;
  is_liked?: boolean;
  // Joined data
  author?: {
    id: string;
    username?: string;
    avatar_url?: string;
    full_name?: string;
  };
  reply_to?: ServerMessage;
}

export interface ServerPostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// Extended server with additional data
export interface ServerWithDetails extends Server {
  channels?: ServerChannel[];
  members?: ServerMember[];
  roles?: ServerRole[];
  member_role?: ServerRole;
  is_member?: boolean;
  is_owner?: boolean;
}

// Create server request
export interface CreateServerRequest {
  name: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  is_public?: boolean;
}

// Join server request
export interface JoinServerRequest {
  invite_code: string;
}

// Create channel request
export interface CreateChannelRequest {
  server_id: string;
  name: string;
  description?: string;
  type?: 'text' | 'voice' | 'announcement' | 'general' | 'chat' | 'post';
  parent_id?: string;
  is_private?: boolean;
}

// Create post request
export interface CreatePostRequest {
  server_id: string;
  channel_id: string;
  title?: string;
  content: string;
  image_url?: string;
  anime_id?: string;
  parent_id?: string;
}

// Create message request
export interface CreateMessageRequest {
  server_id?: string;
  channel_id: string;
  content: string;
  message_type?: 'text' | 'image';
  reply_to_id?: string;
}

// Server permissions
export interface ServerPermissions {
  manage_server: boolean;
  manage_channels: boolean;
  manage_roles: boolean;
  kick_members: boolean;
  ban_members: boolean;
  create_posts: boolean;
  delete_posts: boolean;
  pin_posts: boolean;
  send_messages: boolean;
  delete_messages: boolean;
  mention_everyone: boolean;
  use_voice: boolean;
  moderate_voice: boolean;
}

// Default permissions for different roles
export const DEFAULT_PERMISSIONS: Record<string, Partial<ServerPermissions>> = {
  owner: {
    manage_server: true,
    manage_channels: true,
    manage_roles: true,
    kick_members: true,
    ban_members: true,
    create_posts: true,
    delete_posts: true,
    pin_posts: true,
    send_messages: true,
    delete_messages: true,
    mention_everyone: true,
    use_voice: true,
    moderate_voice: true,
  },
  admin: {
    manage_channels: true,
    kick_members: true,
    ban_members: true,
    create_posts: true,
    delete_posts: true,
    pin_posts: true,
    send_messages: true,
    delete_messages: true,
    mention_everyone: true,
    use_voice: true,
    moderate_voice: true,
  },
  moderator: {
    kick_members: true,
    create_posts: true,
    delete_posts: true,
    pin_posts: true,
    send_messages: true,
    delete_messages: true,
    use_voice: true,
    moderate_voice: true,
  },
  member: {
    create_posts: true,
    send_messages: true,
    use_voice: true,
  },
};

// Server activity types for real-time updates
export interface ServerActivity {
  type: 'user_joined' | 'user_left' | 'message_sent' | 'post_created' | 'channel_created';
  server_id: string;
  channel_id?: string;
  user_id: string;
  data?: any;
  timestamp: string;
}

// Server search/filter options
export interface ServerSearchOptions {
  query?: string;
  is_public?: boolean;
  has_anime_content?: boolean;
  member_count_min?: number;
  member_count_max?: number;
  created_after?: string;
  sort_by?: 'name' | 'member_count' | 'created_at';
  sort_order?: 'asc' | 'desc';
} 