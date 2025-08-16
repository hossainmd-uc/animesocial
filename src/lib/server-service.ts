import { createClient } from './supabase/client';
import type {
  Server,
  ServerWithDetails,
  ServerChannel,
  ServerPost,
  ServerMessage,
  ServerMember,
  CreateServerRequest,
  CreateChannelRequest,
  CreatePostRequest,
  CreateMessageRequest,
  JoinServerRequest,
  ServerSearchOptions,
} from '../types/server';

const supabase = createClient();

// ========== Server Management ==========

export async function createServer(data: CreateServerRequest): Promise<Server | null> {
  try {
    const response = await fetch('/api/servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create server');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating server:', error);
    return null;
  }
}

export async function updateServer(serverId: string, data: Partial<CreateServerRequest>): Promise<Server | null> {
  try {
    const response = await fetch(`/api/servers/${serverId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update server');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating server:', error);
    return null;
  }
}

export async function getServer(serverId: string): Promise<ServerWithDetails | null> {
  try {
    const response = await fetch(`/api/servers/${serverId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch server');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching server:', error);
    return null;
  }
}

export async function getUserServers(): Promise<Server[]> {
  try {
    const response = await fetch('/api/servers');

    if (!response.ok) {
      throw new Error('Failed to fetch user servers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user servers:', error);
    return [];
  }
}

export async function searchServers(options: ServerSearchOptions = {}): Promise<Server[]> {
  try {
    const params = new URLSearchParams();
    
    if (options.query) params.append('query', options.query);
    if (options.member_count_min) params.append('member_count_min', options.member_count_min.toString());
    if (options.member_count_max) params.append('member_count_max', options.member_count_max.toString());
    if (options.created_after) params.append('created_after', options.created_after);
    if (options.sort_by) params.append('sort_by', options.sort_by);
    if (options.sort_order) params.append('sort_order', options.sort_order);

    const response = await fetch(`/api/servers/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to search servers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching servers:', error);
    return [];
  }
}

export async function joinServer(data: JoinServerRequest): Promise<{ success: boolean; server?: Server; error?: string }> {
  try {
    const response = await fetch('/api/servers/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, server: result.server };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to join server' };
    }
  } catch (error) {
    console.error('Error joining server:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

export async function regenerateInviteCode(serverId: string): Promise<{ success: boolean; invite_code?: string; error?: string }> {
  try {
    const response = await fetch(`/api/servers/${serverId}/regenerate-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, invite_code: result.invite_code };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to regenerate invite code' };
    }
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

export async function leaveServer(serverId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/servers/${serverId}/leave`, {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    console.error('Error leaving server:', error);
    return false;
  }
}

// ========== Channel Management ==========

export async function createChannel(data: CreateChannelRequest): Promise<ServerChannel | null> {
  try {
    const response = await fetch(`/api/servers/${data.server_id}/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create channel');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating channel:', error);
    return null;
  }
}

export async function getServerChannels(serverId: string): Promise<ServerChannel[]> {
  try {
    const response = await fetch(`/api/servers/${serverId}/channels`);

    if (!response.ok) {
      throw new Error('Failed to fetch channels');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching channels:', error);
    return [];
  }
}

// ========== Post Management ==========

export async function createPost(data: CreatePostRequest): Promise<ServerPost | null> {
  try {
    const response = await fetch(`/api/servers/${data.server_id}/channels/${data.channel_id}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

export async function getChannelPosts(
  channelId: string,
  limit = 50,
  offset = 0
): Promise<ServerPost[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`/api/channels/${channelId}/posts?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function getPost(postId: string): Promise<ServerPost | null> {
  try {
    const response = await fetch(`/api/posts/${postId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function getPostReplies(postId: string): Promise<ServerPost[]> {
  try {
    const response = await fetch(`/api/posts/${postId}/replies`);

    if (!response.ok) {
      throw new Error('Failed to fetch post replies');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching post replies:', error);
    return [];
  }
}

export async function likePost(postId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    console.error('Error toggling post like:', error);
    return false;
  }
}

export async function unlikePost(postId: string): Promise<boolean> {
  return likePost(postId); // API handles toggle
}

export async function updatePost(
  postId: string, 
  data: { title?: string; content: string; image_url?: string; anime_id?: string }
): Promise<ServerPost | null> {
  try {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

export async function deletePost(postId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete post');
    }

    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// ========== Message Management ==========

export async function createMessage(data: CreateMessageRequest): Promise<ServerMessage | null> {
  try {
    const response = await fetch(`/api/channels/${data.channel_id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating message:', error);
    return null;
  }
}

export async function getChannelMessages(
  channelId: string,
  limit = 50,
  before?: string
): Promise<ServerMessage[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (before) {
      params.append('before', before);
    }

    const response = await fetch(`/api/channels/${channelId}/messages?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function updateMessage(messageId: string, content: string): Promise<ServerMessage | null> {
  try {
    const response = await fetch(`/api/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to update message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating message:', error);
    return null;
  }
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
}

// ========== Member Management ==========

export async function getServerMembers(serverId: string): Promise<ServerMember[]> {
  try {
    const response = await fetch(`/api/servers/${serverId}/members`);

    if (!response.ok) {
      throw new Error('Failed to fetch members');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

// ========== Real-time Subscriptions ==========
// These still use Supabase for real-time functionality

export function subscribeToServerMessages(
  channelId: string,
  onMessage: (message: ServerMessage) => void,
  onDelete?: (id: string) => void
) {
  const subscription = supabase
    .channel(`server_messages:channel_id=eq.${channelId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'server_messages', filter: `channel_id=eq.${channelId}` },
      async (payload) => {
        try {
          const response = await fetch(`/api/messages/${payload.new.id}`);
          if (response.ok) {
            const message = await response.json();
            onMessage(message);
          }
        } catch (error) {
          console.error('Error fetching real-time message:', error);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'server_messages', filter: `channel_id=eq.${channelId}` },
      async (payload) => {
        try {
          const response = await fetch(`/api/messages/${payload.new.id}`);
          if (response.ok) {
            const message = await response.json();
            onMessage(message);
          }
        } catch (error) {
          console.error('Error fetching updated message:', error);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'server_messages', filter: `channel_id=eq.${channelId}` },
      (payload) => {
        if (onDelete) {
          onDelete(payload.old.id as string);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

export function subscribeToServerPosts(
  channelId: string,
  onPost: (post: ServerPost) => void
) {
  const subscription = supabase
    .channel(`server_posts:channel_id=eq.${channelId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'server_posts', filter: `channel_id=eq.${channelId}` },
      async (payload) => {
        // Fetch the full post with author and anime info via API
        try {
          const response = await fetch(`/api/posts/${payload.new.id}`);
          if (response.ok) {
            const post = await response.json();
            onPost(post);
          }
        } catch (error) {
          console.error('Error fetching real-time post:', error);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
} 

// Reply to a message
export async function replyToMessage(
  channelId: string,
  parentId: string,
  content: string
): Promise<ServerMessage> {
  const response = await fetch(`/api/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, parentId })
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to reply to message');
  }

  return response.json() as Promise<ServerMessage>;
}

// Like a message
export async function likeMessage(messageId: string): Promise<{ success: boolean; likeCount: number }> {
  const response = await fetch(`/api/messages/${messageId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to like message');
  }

  return response.json() as Promise<{ success: boolean; likeCount: number }>;
}

// Unlike a message
export async function unlikeMessage(messageId: string): Promise<{ success: boolean; likeCount: number }> {
  const response = await fetch(`/api/messages/${messageId}/like`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to unlike message');
  }

  return response.json() as Promise<{ success: boolean; likeCount: number }>;
}

// Get message replies
export async function getMessageReplies(messageId: string): Promise<ServerMessage[]> {
  const response = await fetch(`/api/messages/${messageId}/replies`);

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to fetch message replies');
  }

  return response.json() as Promise<ServerMessage[]>;
} 