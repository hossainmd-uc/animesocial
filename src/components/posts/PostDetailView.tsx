'use client';

import { useState, useEffect } from 'react';
import { getPost, getPostReplies, likePost, createPost, deletePost } from '../../lib/server-service';
import type { ServerPost } from '../../types/server';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useUser } from '../../hooks/useUser';
import { ArrowLeftIcon, HeartIcon, ChatBubbleLeftIcon, PaperAirplaneIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { organizeReplies } from '../../utils/replyUtils';
import NestedReplyThread from './NestedReplyThread';
import EditPostModal from './EditPostModal';
import Avatar from '../ui/Avatar';
import Link from 'next/link';

interface Props {
  postId: string;
  onBack: () => void;
}

export default function PostDetailView({ postId, onBack }: Props) {
  const [post, setPost] = useState<ServerPost | null>(null);
  const [replies, setReplies] = useState<ServerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isDarkMode, mounted } = useDarkMode();
  const { user } = useUser();

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const [postData, repliesData] = await Promise.all([
        getPost(postId),
        getPostReplies(postId)
      ]);

      if (!postData) {
        setError('Post not found');
        return;
      }

      setPost(postData);
      setReplies(repliesData);
    } catch (error) {
      console.error('Error loading post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      await likePost(post.id);
      setPost(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          is_liked: !prev.is_liked,
          like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1,
        };
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !replyContent.trim()) return;

    try {
      setSubmittingReply(true);
      const newReply = await createPost({
        server_id: post.server_id,
        channel_id: post.channel_id,
        content: replyContent.trim(),
        parent_id: post.id,
      });

      if (newReply) {
        setReplies(prev => [...prev, newReply]);
        setReplyContent('');
        // Update reply count
        setPost(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            reply_count: prev.reply_count + 1,
          };
        });
      }
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReplyAdded = (newReply: ServerPost) => {
    setReplies(prev => [...prev, newReply]);
    // Update reply count
    setPost(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        reply_count: prev.reply_count + 1,
      };
    });
  };

  const handleReplyUpdated = (updatedReply: ServerPost) => {
    setReplies(prev => prev.map(reply => 
      reply.id === updatedReply.id ? updatedReply : reply
    ));
  };

  const handleReplyDeleted = (replyId: string) => {
    setReplies(prev => prev.filter(reply => reply.id !== replyId));
    // Update reply count
    setPost(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        reply_count: prev.reply_count - 1,
      };
    });
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleDeleteClick = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deletePost(postId);
      // Navigate back after successful deletion
      onBack();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePostUpdated = (updatedPost: ServerPost) => {
    setPost(updatedPost);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff/60000);
    if(mins<60) return `${mins}m ago`;
    const hrs=Math.floor(mins/60); if(hrs<24) return `${hrs}h ago`;
    const days=Math.floor(hrs/24); return `${days}d ago`;
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with Back Button */}
        <div className="flex items-center p-4 border-b border-border/30 dark:border-slate-700/30 bg-card/20 backdrop-blur-sm">
          <button
            onClick={onBack}
            className={`p-2 mr-3 ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
            } rounded-lg transition-colors duration-200`}
          >
            <ArrowLeftIcon className={`w-5 h-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`} />
          </button>
          <h2 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Loading...
          </h2>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with Back Button */}
        <div className="flex items-center p-4 border-b border-border/30 dark:border-slate-700/30 bg-card/20 backdrop-blur-sm">
          <button
            onClick={onBack}
            className={`p-2 mr-3 ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
            } rounded-lg transition-colors duration-200`}
          >
            <ArrowLeftIcon className={`w-5 h-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`} />
          </button>
          <h2 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Post Not Found
          </h2>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`w-16 h-16 ${
              isDarkMode ? 'bg-red-900/20' : 'bg-red-100'
            } rounded-full flex items-center justify-center mx-auto mb-4`}>
              <ChatBubbleLeftIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            } mb-2`}>Post Not Found</h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {error || 'The post you\'re looking for doesn\'t exist or has been removed.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user && post.author_id === user.id;

  return (
    <div className="flex flex-col h-9/10 overflow-hidden">
      {/* Header with Back Button */}
      <div className="flex items-center p-4 border-b border-border/30 dark:border-slate-700/30 bg-card/20 backdrop-blur-sm">
        <button
          onClick={onBack}
          className={`p-2 mr-3 ${
            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
          } rounded-lg transition-colors duration-200`}
        >
          <ArrowLeftIcon className={`w-5 h-5 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`} />
        </button>
        <h2 className={`text-xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {post.title || 'Post Details'}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
        {/* Main Post */}
        <div className={`${
          isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50/50 border-gray-200'
        } rounded-lg border p-6`}>
          {/* Post Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Link href={`/discover/${post.author?.username || 'unknown'}`}>
                <Avatar
                  src={post.author?.avatar_url}
                  username={post.author?.username || 'Unknown'}
                  size="md"
                />
              </Link>
              <div>
                <Link 
                  href={`/discover/${post.author?.username || 'unknown'}`}
                  className={`font-medium hover:underline transition-colors ${
                    isDarkMode ? 'text-white hover:text-gray-200' : 'text-gray-900 hover:text-gray-700'
                  }`}
                >
                  {post.author?.username || 'Unknown'}
                </Link>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {timeAgo(post.created_at)}
                </p>
              </div>
            </div>
            
            {/* Edit/Delete buttons for post owner */}
            {isOwner && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEditClick}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-slate-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Edit post"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className={`p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 ${
                    isDarkMode 
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                      : 'text-red-500 hover:text-red-700 hover:bg-red-100'
                  }`}
                  title="Delete post"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="space-y-4">
            {post.title && (
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {post.title}
              </h3>
            )}
            
            <p className={`${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            } whitespace-pre-wrap break-words leading-relaxed`}>
              {post.content}
            </p>
            
            {post.image_url && (
              <div className="mt-4">
                <img 
                  src={post.image_url} 
                  alt={post.title || 'post image'} 
                  className="max-w-full object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity" 
                  style={{ 
                    maxHeight: '500px',
                    width: 'auto',
                    height: 'auto'
                  }}
                  loading="lazy"
                  onClick={() => window.open(post.image_url, '_blank')}
                />
              </div>
            )}

            {/* Post metadata */}
            {post.anime && (
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isDarkMode 
                  ? 'bg-blue-900/20 text-blue-300 border border-blue-800/30' 
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <span>🎌</span>
                <span>{post.anime.title}</span>
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className={`flex items-center space-x-6 mt-6 pt-4 border-t ${
            isDarkMode ? 'border-slate-600' : 'border-gray-200'
          }`}>
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-2 ${
                post.is_liked ? 'text-red-500' : 'text-gray-500'
              } hover:text-red-500 transition-colors duration-200`}
            >
              {post.is_liked ? (
                <HeartSolidIcon className="w-5 h-5" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
              <span className="font-medium">{post.like_count}</span>
            </button>
            
            <div className={`flex items-center space-x-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <ChatBubbleLeftIcon className="w-5 h-5" />
              <span className="font-medium">{post.reply_count}</span>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <div className={`${
          isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50/30 border-gray-200'
        } rounded-lg border p-4`}>
          <h4 className={`text-sm font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          } mb-3`}>
            Add a Reply
          </h4>
          
          <form onSubmit={handleReplySubmit} className="space-y-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="What are your thoughts?"
              className={`w-full p-3 ${
                isDarkMode 
                  ? 'bg-slate-600/60 border-slate-500 text-white placeholder-slate-400' 
                  : 'bg-white/60 border-gray-300 text-gray-900 placeholder-gray-500'
              } border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none`}
              rows={2}
              maxLength={1000}
            />
            
            <div className="flex items-center justify-between">
              <p className={`text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                {replyContent.length}/1000 characters
              </p>
              
              <button
                type="submit"
                disabled={!replyContent.trim() || submittingReply}
                className={`px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 text-sm ${
                  isDarkMode
                    ? 'bg-primary text-white'
                    : 'bg-primary text-black'
                }`}
              >
                {submittingReply ? (
                  <>
                    <div className={`animate-spin rounded-full h-3 w-3 border-b-2 ${
                      isDarkMode ? 'border-white' : 'border-black'
                    }`}></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-3 h-3" />
                    <span>Reply</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-4">
            <h4 className={`text-sm font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Replies ({replies.length})
            </h4>
            
            <NestedReplyThread 
              replies={organizeReplies(replies, post.id)}
              maxDepth={4}
              onReplyAdded={handleReplyAdded}
              onReplyUpdated={handleReplyUpdated}
              onReplyDeleted={handleReplyDeleted}
            />
          </div>
        )}
      </div>
      
      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPostModal
          post={post}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
} 