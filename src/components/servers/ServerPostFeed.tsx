'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import type { ServerWithDetails, ServerChannel, ServerPost } from '../../types/server';
import { 
  getChannelPosts, 
  likePost,
  subscribeToServerPosts 
} from '../../lib/server-service';
import PostCreationModal from '../posts/PostCreationModal';
import PostCard from '../posts/PostCard';

interface ServerPostFeedProps {
  server: ServerWithDetails;
  channel: ServerChannel;
}

export function ServerPostFeed({ server, channel }: ServerPostFeedProps) {
  const [posts, setPosts] = useState<ServerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPosts();

    // Subscribe to real-time posts
    const unsubscribe = subscribeToServerPosts(channel.id, (newPost) => {
      setPosts(prev => {
        // Check if post already exists (to avoid duplicates)
        const exists = prev.some(post => post.id === newPost.id);
        if (exists) return prev;
        
        return [...prev, newPost];
      });
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [channel.id]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const channelPosts = await getChannelPosts(channel.id);
      setPosts(channelPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
      // Update post like status optimistically
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !post.is_liked,
            like_count: post.is_liked ? post.like_count - 1 : post.like_count + 1,
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReply = (postId: string) => {
    setShowCreateModal(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 dark:border-slate-700/30 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 text-muted-foreground">
            {channel.type === 'announcement' ? '📢' : '#'}
          </div>
          <h1 className="text-lg font-semibold text-foreground">{channel.name}</h1>
          {channel.description && (
            <div className="hidden sm:block">
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground ml-2">{channel.description}</span>
            </div>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 flex flex-col overflow-y-auto" ref={feedRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                <ChatBubbleLeftIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground">Be the first to start a conversation in #{channel.name}!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/30 dark:divide-slate-700/30">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleReply} />
            ))}
          </div>
        )}
      </div>

      {/* New Post Input */}
      <div className="p-4 border-t border-border/30 dark:border-slate-700/30 bg-card/20 backdrop-blur-sm">
        { (channel.type==='post' || channel.type==='announcement') && (
           <div className="p-4 border-b border-border flex justify-end">
             <button onClick={()=>setShowCreateModal(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">New Post</button>
           </div>
        )}
      </div>

      {showCreateModal && (
        <PostCreationModal serverId={server.id} channelId={channel.id} onCreated={(post)=>setPosts(prev=>[...prev,post])} onClose={()=>setShowCreateModal(false)} />
      )}
    </div>
  );
} 