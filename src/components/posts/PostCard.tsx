'use client';

import { useState } from 'react';
import type { ServerPost } from '../../types/server';
import { HeartIcon, ChatBubbleLeftIcon, ArrowTopRightOnSquareIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useUser } from '../../hooks/useUser';
import { deletePost } from '../../lib/server-service';
import EditPostModal from './EditPostModal';
import Avatar from '../ui/Avatar';

interface Props {
  post: ServerPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onPostClick: (postId: string) => void;
  onPostUpdated?: (updatedPost: ServerPost) => void;
  onPostDeleted?: (postId: string) => void;
}

export default function PostCard({ post, onLike, onComment, onPostClick, onPostUpdated, onPostDeleted }: Props) {
  const { isDarkMode, mounted } = useDarkMode();
  const { user } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!mounted) return null;

  const isOwner = user && post.author_id === user.id;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff/60000);
    if(mins<60) return `${mins}m ago`;
    const hrs=Math.floor(mins/60); if(hrs<24) return `${hrs}h ago`;
    const days=Math.floor(hrs/24); return `${days}d ago`;
  };

  const handlePostClick = () => {
    onPostClick(post.id);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(post.id);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment(post.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deletePost(post.id);
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePostUpdated = (updatedPost: ServerPost) => {
    if (onPostUpdated) {
      onPostUpdated(updatedPost);
    }
  };

  return (
    <div className={`border-y ${
      isDarkMode ? 'border-slate-700/30' : 'border-gray-200/50'
    } py-4 px-6 flex hover:bg-opacity-50 transition-all duration-200 ${
      isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50/50'
    }`}>
      {/* Action bar */}
      <div className="flex flex-col items-center mr-4 gap-4 text-muted-foreground">
        <button 
          onClick={handleLikeClick} 
          className="flex flex-col items-center hover:text-red-500 transition-colors duration-200 p-1 rounded-lg"
        >
          {post.is_liked? <HeartSolidIcon className="w-5 h-5 mb-0.5 text-red-500"/>:<HeartIcon className="w-5 h-5 mb-0.5"/>}
          <span className="text-xs font-medium">{post.like_count}</span>
        </button>
        <button 
          onClick={handleCommentClick} 
          className="flex flex-col items-center hover:text-blue-500 transition-colors duration-200 p-1 rounded-lg"
        >
          <ChatBubbleLeftIcon className="w-5 h-5 mb-0.5"/>
          <span className="text-xs font-medium">{post.reply_count}</span>
        </button>
      </div>

      <div 
        className="flex-1 space-y-3 cursor-pointer group" 
        onClick={handlePostClick}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <Avatar
              src={post.author?.avatar_url}
              username={post.author?.username ?? 'Unknown'}
              size="sm"
            />
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {post.author?.username ?? 'Unknown'}
              </span>
              <span className="text-xs">•</span>
              <span className={`${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {timeAgo(post.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Edit/Delete buttons for post owner */}
            {isOwner && (
              <>
                <button
                  onClick={handleEditClick}
                  className={`p-1 rounded-md transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-slate-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Edit post"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className={`p-1 rounded-md transition-colors duration-200 disabled:opacity-50 ${
                    isDarkMode 
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                      : 'text-red-500 hover:text-red-700 hover:bg-red-100'
                  }`}
                  title="Delete post"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <div className={`w-px h-4 ${
                  isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                }`}></div>
              </>
            )}
            
            {/* View Post link */}
            <div className="flex items-center space-x-1">
            <ArrowTopRightOnSquareIcon className={`w-4 h-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <span className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              View Post
            </span>
            </div>
          </div>
        </div>
        
        {post.title && (
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          } group-hover:text-primary transition-colors duration-200`}>
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
              alt={post.title||'post image'} 
              className="w-full object-cover max-h-80 group-hover:scale-[1.02] transition-transform duration-300" 
            />
          </div>
        )}

        {/* Post metadata */}
        {post.anime && (
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
            isDarkMode 
              ? 'bg-blue-900/20 text-blue-300 border border-blue-800/30' 
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <span>🎌</span>
            <span>{post.anime.title}</span>
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