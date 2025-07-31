'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { updatePost } from '../../lib/server-service';
import type { ServerPost } from '../../types/server';

interface EditReplyModalProps {
  reply: ServerPost;
  isOpen: boolean;
  onClose: () => void;
  onReplyUpdated: (updatedReply: ServerPost) => void;
}

export default function EditReplyModal({ reply, isOpen, onClose, onReplyUpdated }: EditReplyModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, mounted } = useDarkMode();

  useEffect(() => {
    if (reply && isOpen) {
      setContent(reply.content || '');
      setError(null);
    }
  }, [reply, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Reply content is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updatedReply = await updatePost(reply.id, {
        content: content.trim()
      });

      if (updatedReply) {
        onReplyUpdated(updatedReply);
        onClose();
      } else {
        setError('Failed to update reply');
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      setError(error instanceof Error ? error.message : 'Failed to update reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className={`w-full max-w-md rounded-2xl border shadow-2xl ${
          isDarkMode 
            ? 'bg-slate-800/95 border-slate-700' 
            : 'bg-white/95 border-gray-200'
        } backdrop-blur-lg`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
            }`}>
              <PencilIcon className={`w-5 h-5 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <h2 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Edit Reply
            </h2>
          </div>
          
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className={`p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-800 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {error}
            </div>
          )}

          {/* Content Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Reply Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What are your thoughts?"
              className={`w-full p-3 rounded-lg border transition-all duration-200 resize-none ${
                isDarkMode 
                  ? 'bg-slate-700/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                  : 'bg-gray-50/60 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              } focus:outline-none`}
              rows={4}
              maxLength={1000}
              required
            />
            <div className="flex justify-between items-center mt-1">
              <div></div>
              <span className={`text-xs ${
                content.length > 900 
                  ? 'text-red-500' 
                  : isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                {content.length}/1000
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isDarkMode 
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <PencilIcon className="w-4 h-4" />
                  <span>Update Reply</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 