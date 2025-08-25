'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import type { ServerPost } from '../../types/server';
import { updatePost } from '../../lib/server-service';

interface EditPostModalProps {
  post: ServerPost;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: ServerPost) => void;
}

export default function EditPostModal({ post, isOpen, onClose, onPostUpdated }: EditPostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, mounted } = useDarkMode();

  useEffect(() => {
    if (isOpen && post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setImageUrl(post.image_url || '');
      setError(null);
    }
  }, [isOpen, post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updatedPost = await updatePost(post.id, {
        title: title.trim() || undefined,
        content: content.trim(),
        image_url: imageUrl.trim() || undefined,
      });

      if (updatedPost) {
        onPostUpdated(updatedPost);
        onClose();
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setError(error instanceof Error ? error.message : 'Failed to update post');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full max-w-2xl ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      } rounded-xl border shadow-2xl overflow-hidden`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Edit Post
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={`p-2 ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
            } rounded-lg transition-colors duration-200 disabled:opacity-50`}
          >
            <XMarkIcon className={`w-5 h-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              maxLength={100}
              className={`w-full p-3 ${
                isDarkMode 
                  ? 'bg-slate-700/60 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200`}
            />
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {title.length}/100 characters
            </p>
          </div>

          {/* Content */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind about anime?"
              className={`w-full p-3 ${
                isDarkMode 
                  ? 'bg-slate-700/60 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none`}
              rows={6}
              maxLength={2000}
              required
            />
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {content.length}/2000 characters
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Image URL (optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={`w-full p-3 ${
                isDarkMode 
                  ? 'bg-slate-700/60 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200`}
            />
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="mt-4">
              <p className={`text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Preview:
              </p>
              <div className="rounded-lg overflow-hidden border border-gray-200/20">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`px-4 py-2 ${
                isDarkMode 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } rounded-lg transition-colors duration-200 disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className={`px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 ${
                isDarkMode
                  ? 'bg-primary text-white'
                  : 'bg-primary text-black'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${
                    isDarkMode ? 'border-white' : 'border-black'
                  }`}></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4" />
                  <span>Update Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 