'use client';

import { useState } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useUser } from '../../hooks/useUser';
import { ChatBubbleLeftIcon, PaperAirplaneIcon, ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { NestedReply } from '../../utils/replyUtils';
import type { ServerPost } from '../../types/server';
import { createPost, deletePost } from '../../lib/server-service';
import EditReplyModal from './EditReplyModal';
import Avatar from '../ui/Avatar';

interface NestedReplyThreadProps {
  replies: NestedReply[];
  maxDepth?: number;
  onReplyAdded?: (reply: ServerPost) => void;
  onReplyUpdated?: (reply: ServerPost) => void;
  onReplyDeleted?: (replyId: string) => void;
}

interface ReplyItemProps {
  reply: NestedReply;
  maxDepth: number;
  onReplyAdded?: (reply: ServerPost) => void;
  onReplyUpdated?: (reply: ServerPost) => void;
  onReplyDeleted?: (replyId: string) => void;
}

function ReplyItem({ reply, maxDepth, onReplyAdded, onReplyUpdated, onReplyDeleted }: ReplyItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isDarkMode } = useDarkMode();
  const { user } = useUser();

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff/60000);
    if(mins<60) return `${mins}m ago`;
    const hrs=Math.floor(mins/60); if(hrs<24) return `${hrs}h ago`;
    const days=Math.floor(hrs/24); return `${days}d ago`;
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const newReply = await createPost({
        server_id: reply.server_id,
        channel_id: reply.channel_id,
        content: replyContent.trim(),
        parent_id: reply.id,
      });

      if (newReply && onReplyAdded) {
        onReplyAdded(newReply);
        setReplyContent('');
        setShowReplyForm(false);
      }
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deletePost(reply.id);
      if (onReplyDeleted) {
        onReplyDeleted(reply.id);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete reply');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplyUpdated = (updatedReply: ServerPost) => {
    if (onReplyUpdated) {
      onReplyUpdated(updatedReply);
    }
  };

  // Calculate indentation based on depth (max out at certain depth to prevent too much nesting)
  const effectiveDepth = Math.min(reply.depth, maxDepth);
  const indentationClass = effectiveDepth > 0 ? `ml-${Math.min(effectiveDepth * 4, 16)}` : '';
  const isOwner = user && reply.author_id === user.id;
  
  return (
    <div className={`${indentationClass} ${reply.depth > 0 ? 'border-l-2 border-gray-200/30 dark:border-slate-600/30 pl-4' : ''}`}>
      <div className={`${
        isDarkMode ? 'bg-slate-700/20 border-slate-600/50' : 'bg-white/20 border-gray-200/50'
      } rounded-lg border p-3 mb-3 group`}>
        <div className="flex items-center space-x-2 mb-2">
          <Avatar
            src={reply.author?.avatar_url}
            username={reply.author?.username || 'Unknown'}
            size="xs"
          />
          <div className="flex-1">
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
          
          {/* Edit/Delete buttons for reply owner */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isOwner && (
              <>
                <button
                  onClick={handleEditClick}
                  className={`p-1 rounded-md transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-slate-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Edit reply"
                >
                  <PencilIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className={`p-1 rounded-md transition-colors duration-200 disabled:opacity-50 ${
                    isDarkMode 
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                      : 'text-red-500 hover:text-red-700 hover:bg-red-100'
                  }`}
                  title="Delete reply"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
                <div className={`w-px h-3 ${
                  isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                }`}></div>
              </>
            )}
          </div>
          
          {/* Collapse/Expand button - only show if there are children */}
          {reply.children.length > 0 && (
            <button
              onClick={toggleCollapsed}
              className={`text-xs px-2 py-1 rounded-md transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={isCollapsed ? `Show ${reply.children.length} replies` : 'Hide replies'}
            >
              {isCollapsed ? (
                <>
                  <ChevronRightIcon className="w-3 h-3 inline mr-1" />
                  {reply.children.length}
                </>
              ) : (
                <ChevronDownIcon className="w-3 h-3 inline mr-1" />
              )}
            </button>
          )}
          
          {/* Reply button - only show if not at max depth */}
          {reply.depth < maxDepth && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className={`text-xs px-2 py-1 rounded-md transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChatBubbleLeftIcon className="w-3 h-3 inline mr-1" />
              Reply
            </button>
          )}
        </div>
        
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        } whitespace-pre-wrap break-words leading-relaxed mb-2`}>
          {reply.content}
        </p>

        {/* Reply Form */}
        {showReplyForm && (
          <div className={`mt-3 p-3 ${
            isDarkMode ? 'bg-slate-600/30 border-slate-500/50' : 'bg-gray-50/50 border-gray-300/50'
          } rounded-lg border`}>
            <form onSubmit={handleReplySubmit} className="space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${reply.author?.username || 'this comment'}...`}
                className={`w-full p-2 text-sm ${
                  isDarkMode 
                    ? 'bg-slate-700/60 border-slate-500 text-white placeholder-slate-400' 
                    : 'bg-white/60 border-gray-300 text-gray-900 placeholder-gray-500'
                } border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none`}
                rows={2}
                maxLength={1000}
              />
              
              <div className="flex items-center justify-between">
                <p className={`text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  {replyContent.length}/1000 characters
                </p>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                    className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
                      isDarkMode 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-600' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || submitting}
                    className={`px-2 py-1 text-xs rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-1 ${
                      isDarkMode
                        ? 'bg-primary text-white'
                        : 'bg-primary text-black'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className={`animate-spin rounded-full h-2 w-2 border-b-2 ${
                          isDarkMode ? 'border-white' : 'border-black'
                        }`}></div>
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-2 h-2" />
                        <span>Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Render children recursively - only if not collapsed */}
      {reply.children.length > 0 && !isCollapsed && (
        <div className="space-y-2">
          {reply.children.map((childReply) => (
            <ReplyItem 
              key={childReply.id} 
              reply={childReply} 
              maxDepth={maxDepth}
              onReplyAdded={onReplyAdded}
              onReplyUpdated={onReplyUpdated}
              onReplyDeleted={onReplyDeleted}
            />
          ))}
        </div>
      )}
      
      {/* Edit Reply Modal */}
      {showEditModal && (
        <EditReplyModal
          reply={reply}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onReplyUpdated={handleReplyUpdated}
        />
      )}
    </div>
  );
}

export default function NestedReplyThread({ replies, maxDepth = 4, onReplyAdded, onReplyUpdated, onReplyDeleted }: NestedReplyThreadProps) {
  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => (
        <ReplyItem 
          key={reply.id} 
          reply={reply} 
          maxDepth={maxDepth}
          onReplyAdded={onReplyAdded}
          onReplyUpdated={onReplyUpdated}
          onReplyDeleted={onReplyDeleted}
        />
      ))}
    </div>
  );
} 