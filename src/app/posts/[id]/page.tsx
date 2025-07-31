'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/src/components/layout/Header';
import { getPost, getPostReplies, likePost, createPost, deletePost } from '@/src/lib/server-service';
import type { ServerPost } from '@/src/types/server';
import { useDarkMode } from '@/src/hooks/useDarkMode';
import { useUser } from '@/src/hooks/useUser';
import { ArrowLeftIcon, HeartIcon, ChatBubbleLeftIcon, PaperAirplaneIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { createClient } from '@/src/lib/supabase/client';
import EditReplyModal from '@/src/components/posts/EditReplyModal';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<ServerPost | null>(null);
  const [replies, setReplies] = useState<ServerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
  const { isDarkMode, mounted } = useDarkMode();
  const { user } = useUser();

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
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

  const handleReplyUpdated = (updatedReply: ServerPost) => {
    setReplies(prev => prev.map(reply => 
      reply.id === updatedReply.id ? updatedReply : reply
    ));
  };

  const handleReplyEdit = (replyId: string) => {
    setEditingReplyId(replyId);
  };

  const handleReplyDelete = async (replyId: string) => {
    if (!window.confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingReplyId(replyId);
      await deletePost(replyId);
      setReplies(prev => prev.filter(reply => reply.id !== replyId));
      // Update reply count
      setPost(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reply_count: prev.reply_count - 1,
        };
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete reply');
    } finally {
      setDeletingReplyId(null);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff/60000);
    if(mins<60) return `${mins}m ago`;
    const hrs=Math.floor(mins/60); if(hrs<24) return `${hrs}h ago`;
    const days=Math.floor(hrs/24); return `${days}d ago`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen smooth-gradient transition-all duration-500">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen smooth-gradient transition-all duration-500">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
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
      <div className="min-h-screen smooth-gradient transition-all duration-500">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 ${
              isDarkMode ? 'bg-red-900/20' : 'bg-red-100'
            } rounded-full flex items-center justify-center mx-auto`}>
              <ChatBubbleLeftIcon className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              } mb-2`}>Post Not Found</h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                {error || 'The post you\'re looking for doesn\'t exist or has been removed.'}
              </p>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen smooth-gradient transition-all duration-500">
      <Header />
      
      <div className="content-wrapper section-padding py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => router.back()}
              className={`p-2 ${
                isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
              } rounded-lg transition-colors duration-200`}
            >
              <ArrowLeftIcon className={`w-5 h-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {post.title || 'Post'}
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                by {post.author?.username || 'Unknown'} • {timeAgo(post.created_at)}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Main Post */}
            <div className={`${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-gray-200'
            } rounded-xl border backdrop-blur-sm p-6`}>
              {/* Post Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
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
                  <h2 className={`text-xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {post.title}
                  </h2>
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
                      className="w-full object-cover max-h-96 rounded-lg" 
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
              <div className="flex items-center space-x-6 mt-6 pt-4 border-t border-gray-200/50">
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
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-gray-200'
            } rounded-xl border backdrop-blur-sm p-6`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              } mb-4`}>
                Add a Reply
              </h3>
              
              <form onSubmit={handleReplySubmit} className="space-y-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="What are your thoughts?"
                  className={`w-full p-3 ${
                    isDarkMode 
                      ? 'bg-slate-700/60 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-gray-50/60 border-gray-300 text-gray-900 placeholder-gray-500'
                  } border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none`}
                  rows={3}
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
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                  >
                    {submittingReply ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-4 h-4" />
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
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Replies ({replies.length})
                </h3>
                
                <div className="space-y-4">
                  {replies.map((reply) => {
                    const isOwner = user && reply.author_id === user.id;
                    const isDeleting = deletingReplyId === reply.id;
                    
                    return (
                    <div key={reply.id} className={`${
                      isDarkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white/30 border-gray-200/50'
                      } rounded-lg border backdrop-blur-sm p-4 group`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${
                          isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
                        } rounded-full flex items-center justify-center`}>
                          <span className={`text-sm font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {(reply.author?.username || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${
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
                          
                          {/* Edit/Delete buttons for reply owner */}
                          {isOwner && (
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleReplyEdit(reply.id)}
                                className={`p-2 rounded-md transition-colors duration-200 ${
                                  isDarkMode 
                                    ? 'text-gray-400 hover:text-white hover:bg-slate-600' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                                title="Edit reply"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReplyDelete(reply.id)}
                                disabled={isDeleting}
                                className={`p-2 rounded-md transition-colors duration-200 disabled:opacity-50 ${
                                  isDarkMode 
                                    ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                                    : 'text-red-500 hover:text-red-700 hover:bg-red-100'
                                }`}
                                title="Delete reply"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                      </div>
                      
                      <p className={`${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      } whitespace-pre-wrap break-words leading-relaxed`}>
                        {reply.content}
                      </p>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Reply Modal */}
      {editingReplyId && (
        <EditReplyModal
          reply={replies.find(r => r.id === editingReplyId)!}
          isOpen={!!editingReplyId}
          onClose={() => setEditingReplyId(null)}
          onReplyUpdated={handleReplyUpdated}
        />
      )}
    </div>
  );
} 