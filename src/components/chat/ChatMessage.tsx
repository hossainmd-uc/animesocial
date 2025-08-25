import React, { useState, useRef, useEffect } from 'react';
import { HeartIcon, ChatBubbleLeftIcon, EllipsisHorizontalIcon, ArrowUpIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useUser } from '../../hooks/useUser';
import Avatar from '../ui/Avatar';
import Link from 'next/link';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    author: {
      username: string;
      avatar_url?: string;
    };
    created_at: string;
    updated_at?: string;
    parent_id?: string;
    like_count?: number;
    reply_count?: number;
    is_liked?: boolean;
  };
  onReply?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onUnlike?: (messageId: string) => void;
  onJumpToParent?: (parentId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  currentUserId?: string;
  isReply?: boolean;
  parentMessage?: {
    id: string;
    content: string;
    author: {
      username: string;
    };
  };
}

export default function ChatMessage({ 
  message, 
  onReply, 
  onLike, 
  onUnlike, 
  onJumpToParent,
  onEdit,
  onDelete,
  currentUserId,
  isReply = false,
  parentMessage
}: ChatMessageProps) {
  const { isDarkMode } = useDarkMode();
  const { user } = useUser();
  const [showActions, setShowActions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [originalContent] = useState(message.content);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwnMessage = currentUserId && user && (
    message.author.username === user.user_metadata?.username ||
    message.author.username === user.email?.split('@')[0]
  );

  const handleLikeToggle = () => {
    if (message.is_liked) {
      onUnlike?.(message.id);
    } else {
      onLike?.(message.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowDropdown(false);
    setTimeout(() => {
      editTextareaRef.current?.focus();
    }, 0);
  };

  const handleEditSave = () => {
    if (editContent.trim() && editContent.trim() !== originalContent) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete?.(message.id);
    }
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isEdited = message.updated_at && message.updated_at !== message.created_at;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div 
      id={`message-${message.id}`}
      className={`group relative p-3 rounded-lg transition-colors ${
        isReply 
          ? `border-l-2 ${isDarkMode ? 'border-blue-400/60 bg-slate-800/30' : 'border-blue-500/60 bg-blue-50/50'}`
          : isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Reply to indicator */}
      {isReply && parentMessage && (
        <div 
          className={`flex items-center gap-2 mb-2 p-2 rounded-md cursor-pointer transition-colors ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-300 hover:bg-slate-800/70' 
              : 'bg-gray-100/80 border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
          onClick={() => onJumpToParent?.(parentMessage.id)}
        >
          <div className={`p-1 rounded ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
            <ArrowUpIcon className="w-3 h-3 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs">Replying to {parentMessage.author.username}</span>
            </div>
            <div className={`text-xs opacity-75 truncate ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
              {truncateContent(parentMessage.content, 60)}
            </div>
          </div>
        </div>
      )}

      {/* Message Header */}
      <div className="flex items-center gap-2 mb-1">
        <Link href={`/discover/${message.author.username}`} className="flex-shrink-0">
          <Avatar
            src={message.author.avatar_url}
            username={message.author.username}
            size="sm"
          />
        </Link>
        <Link 
          href={`/discover/${message.author.username}`}
          className={`font-medium text-base hover:underline transition-colors ${
            isDarkMode ? 'text-slate-200 hover:text-slate-100' : 'text-gray-900 hover:text-gray-700'
          }`}
        >
          {message.author.username}
        </Link>
        <span className={`text-xs ${
          isDarkMode ? 'text-slate-400' : 'text-gray-500'
        }`}>
          {formatTimestamp(message.created_at)}
          {isEdited && (
            <span className="ml-1 opacity-60">(edited)</span>
          )}
        </span>
      </div>

      {/* Message Content */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={editTextareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full p-2 text-base rounded-md border resize-none focus:outline-none focus:ring-2 ${
              isDarkMode
                ? 'bg-slate-700 border-slate-600 text-slate-300 focus:ring-blue-500'
                : 'bg-white border-gray-300 text-gray-800 focus:ring-blue-500'
            }`}
            rows={3}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditSave}
              disabled={!editContent.trim()}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                editContent.trim()
                  ? isDarkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-400 cursor-not-allowed text-gray-200'
              }`}
            >
              <CheckIcon className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={handleEditCancel}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                isDarkMode
                  ? 'bg-slate-600 hover:bg-slate-700 text-slate-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <XMarkIcon className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`text-base ${
          isDarkMode ? 'text-slate-300' : 'text-gray-800'
        }`}>
          {message.content}
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex items-center gap-2 mt-2 transition-opacity ${
        showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        {/* Like Button */}
        <button
          onClick={handleLikeToggle}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            message.is_liked
              ? isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'
              : isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          {message.is_liked ? (
            <HeartSolidIcon className="w-4 h-4" />
          ) : (
            <HeartIcon className="w-4 h-4" />
          )}
          {(message.like_count || 0) > 0 && (
            <span className="text-xs font-medium">{message.like_count || 0}</span>
          )}
        </button>

        {/* Reply Button */}
        <button
          onClick={() => onReply?.(message.id)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
          {(message.reply_count || 0) > 0 && (
            <span className="text-xs font-medium">{message.reply_count || 0}</span>
          )}
        </button>

        {/* View Profile Button - Only show for other users' messages */}
        {!isOwnMessage && (
          <Link href={`/discover/${message.author.username}`}>
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="View Profile"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          </Link>
        )}

        {/* More Actions - Only show for own messages */}
        {isOwnMessage && !isEditing && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`p-1 rounded-md transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <EllipsisHorizontalIcon className="w-4 h-4" />
            </button>

            {showDropdown && (
              <div className={`absolute right-0 top-8 z-10 w-32 rounded-md shadow-lg border ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="py-1">
                  <button
                    onClick={handleEdit}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                      isDarkMode 
                        ? 'text-slate-300 hover:bg-slate-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <PencilIcon className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                      isDarkMode 
                        ? 'text-red-400 hover:bg-slate-700' 
                        : 'text-red-600 hover:bg-gray-100'
                    }`}
                  >
                    <TrashIcon className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 