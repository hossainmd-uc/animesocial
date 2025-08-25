'use client';

import { useState, useEffect } from 'react';
import { getPost, getPostReplies, likePost, createPost } from '../../lib/server-service';
import type { ServerPost } from '../../types/server';
import { useDarkMode } from '../../hooks/useDarkMode';
import { XMarkIcon, HeartIcon, ChatBubbleLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface Props {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostDetailModal({ postId, isOpen, onClose }: Props) {
  const [post, setPost] = useState<ServerPost | null>(null);
  const [replies, setReplies] = useState<ServerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const { isDarkMode, mounted } = useDarkMode();

  useEffect(() => {
    if (isOpen && postId) {
      loadPost();
    }
  }, [isOpen, postId]);

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

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff/60000);
    if(mins<60) return `${mins}m ago`;
    const hrs=Math.floor(mins/60); if(hrs<24) return `${hrs}h ago`;
    const days=Math.floor(hrs/24); return `${days}d ago`;
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      } rounded-xl border shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {loading ? 'Loading...' : post?.title || 'Post Details'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
            } rounded-lg transition-colors duration-200`}
          >
            <XMarkIcon className={`w-5 h-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading post...</p>
              </div>
            </div>
          ) : error || !post ? (
            <div className="text-center py-12">
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
          ) : (
            <>
              {/* Main Post */}
              <div className={`${
                isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50/50 border-gray-200'
              } rounded-lg border p-6`}>
                {/* Post Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 ${
                    isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                  } rounded-full flex items-center justify-center`}>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {(post.author?.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {post.author?.username || 'Unknown'}
                    </p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {timeAgo(post.created_at)}
                    </p>
                  </div>
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
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt={post.title || 'post image'} 
                        className="w-full object-cover max-h-64 rounded-lg" 
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
                <div className="space-y-3">
                  <h4 className={`text-sm font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Replies ({replies.length})
                  </h4>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {replies.map((reply) => (
                      <div key={reply.id} className={`${
                        isDarkMode ? 'bg-slate-700/20 border-slate-600/50' : 'bg-white/20 border-gray-200/50'
                      } rounded-lg border p-3`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-6 h-6 ${
                            isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                          } rounded-full flex items-center justify-center`}>
                            <span className={`text-xs font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {(reply.author?.username || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className={`font-medium text-xs ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {reply.author?.username || 'Unknown'}
                            </p>
                            <p className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {timeAgo(reply.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        } whitespace-pre-wrap break-words leading-relaxed`}>
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 