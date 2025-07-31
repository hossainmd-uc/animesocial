import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';

interface ChatReplyInputProps {
  replyingTo: {
    id: string;
    content: string;
    author: {
      username: string;
    };
  } | null;
  onSendReply: (content: string, parentId: string) => void;
  onCancelReply: () => void;
  placeholder?: string;
}

export default function ChatReplyInput({ 
  replyingTo, 
  onSendReply, 
  onCancelReply,
  placeholder = "Type a reply..." 
}: ChatReplyInputProps) {
  const [content, setContent] = useState('');
  const { isDarkMode } = useDarkMode();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && replyingTo) {
      onSendReply(content.trim(), replyingTo.id);
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      onCancelReply();
    }
  };

  if (!replyingTo) return null;

  return (
    <div className={`border-t ${
      isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
    }`}>
      {/* Reply Context */}
      <div className={`px-4 py-2 flex items-center justify-between ${
        isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${
            isDarkMode ? 'text-slate-300' : 'text-gray-600'
          }`}>
            Replying to {replyingTo.author.username}:
          </span>
          <span className={`text-xs ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}>
            "{replyingTo.content.length > 50 
              ? replyingTo.content.substring(0, 50) + '...'
              : replyingTo.content}"
          </span>
        </div>
        <button
          onClick={onCancelReply}
          className={`p-1 rounded transition-colors ${
            isDarkMode 
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Reply Input */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={!content.trim()}
            className={`p-2 rounded-lg transition-colors ${
              content.trim()
                ? isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                : isDarkMode
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
        <div className={`text-xs mt-1 ${
          isDarkMode ? 'text-slate-500' : 'text-gray-400'
        }`}>
          Press Enter to send, Shift+Enter for new line, Escape to cancel
        </div>
      </form>
    </div>
  );
} 