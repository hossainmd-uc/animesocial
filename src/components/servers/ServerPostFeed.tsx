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
import PostDetailView from '../posts/PostDetailView';

interface ServerPostFeedProps {
  serverId: string;
  channelId: string;
  channelName: string;
}

export function ServerPostFeed({ serverId, channelId, channelName }: ServerPostFeedProps) {
  const [posts, setPosts] = useState<ServerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPosts();

    // Subscribe to real-time posts
    const unsubscribe = subscribeToServerPosts(channelId, (newPost) => {
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
  }, [channelId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const channelPosts = await getChannelPosts(channelId);
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

  const handleReply = (_postId: string) => {
    setShowCreateModal(true);
  };

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };

  const handleBackToFeed = () => {
    setSelectedPostId(null);
  };

  const handlePostUpdated = (updatedPost: ServerPost) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  // If a post is selected, show the post detail view
  if (selectedPostId) {
    return (
      <PostDetailView 
        postId={selectedPostId} 
        onBack={handleBackToFeed}
      />
    );
  }

  return (
    <div className="flex flex-col h-svh overflow-hidden">
      {/* Channel Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 dark:border-slate-700/30 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 text-muted-foreground">
            #
          </div>
          <h1 className="text-lg font-semibold text-foreground">{channelName}</h1>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0" ref={feedRef} style={{maxHeight: 'calc(100vh - 250px)'}}>
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
                <p className="text-muted-foreground">Be the first to start a conversation in #{channelName}!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/30 dark:divide-slate-700/30">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLike={handleLike} 
                onComment={handleReply} 
                onPostClick={handlePostClick}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Post Input */}
      <div className="p-2 border-t border-border/30 dark:border-slate-700/30 bg-card/20 backdrop-blur-sm flex-shrink-0">
        <div className="flex justify-center">
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Create New Post
          </button>
        </div>
      </div>

      {showCreateModal && (
        <PostCreationModal serverId={serverId} channelId={channelId} onCreated={(post)=>setPosts(prev=>[...prev,post])} onClose={()=>setShowCreateModal(false)} />
      )}
    </div>
  );
} 