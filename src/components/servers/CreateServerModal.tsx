'use client';

import { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { createServer } from '../../lib/server-service';
import type { Server, CreateServerRequest } from '../../types/server';
import { useDarkMode } from '../../hooks/useDarkMode';
import ImageUpload from '../common/ImageUpload';
import { useUser } from '../../hooks/useUser';

interface CreateServerModalProps {
  onClose: () => void;
  onServerCreated: (server: Server) => void;
}

export function CreateServerModal({ onClose, onServerCreated }: CreateServerModalProps) {
  const [formData, setFormData] = useState<CreateServerRequest>({
    name: '',
    description: '',
    is_public: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, mounted } = useDarkMode();
  const { user } = useUser();

  if (!mounted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Server name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const newServer = await createServer({
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      });

      if (newServer) {
        onServerCreated(newServer);
      } else {
        setError('Failed to create server. Please try again.');
      }
    } catch (error) {
      console.error('Error creating server:', error);
      setError('Failed to create server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateServerRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      } rounded-2xl shadow-2xl border max-w-md w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Create Your Server</h2>
          <button
            onClick={onClose}
            className={`p-2 ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
            } rounded-lg transition-colors duration-200`}
          >
            <XMarkIcon className={`w-5 h-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Server Icon Upload */}
          <div className="flex justify-center">
            <ImageUpload
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, icon_url: url }))}
              onError={(error) => setError(error)}
              currentImageUrl={formData.icon_url}
              uploadOptions={{
                bucket: 'server',
                folder: user?.id || 'temp',
                maxSizeBytes: 2 * 1024 * 1024, // 2MB for server icons
              }}
              label="Server Icon"
              className="text-center"
              previewClassName="mx-auto"
              disabled={submitting}
            />
          </div>

          {/* Server Name */}
          <div className="space-y-2">
            <label htmlFor="serverName" className={`block text-sm font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Server Name *
            </label>
            <input
              id="serverName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="My Awesome Anime Server"
              className={`w-full p-3 ${
                isDarkMode 
                  ? 'bg-slate-700/60 border-slate-600/20 text-white placeholder-slate-400' 
                  : 'bg-gray-50/60 border-gray-200/20 text-gray-900 placeholder-gray-500'
              } border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200`}
              maxLength={100}
              required
            />
            <p className={`text-xs ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {formData.name.length}/100 characters
            </p>
          </div>

          {/* Server Description */}
          <div className="space-y-2">
            <label htmlFor="serverDescription" className={`block text-sm font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Description
            </label>
            <textarea
              id="serverDescription"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="A place for anime fans to discuss their favorite shows, share recommendations, and connect with fellow otaku!"
              className={`w-full p-3 ${
                isDarkMode 
                  ? 'bg-slate-700/60 border-slate-600/20 text-white placeholder-slate-400' 
                  : 'bg-gray-50/60 border-gray-200/20 text-gray-900 placeholder-gray-500'
              } border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none`}
              rows={3}
              maxLength={500}
            />
            <p className={`text-xs ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {(formData.description?.length || 0)}/500 characters
            </p>
          </div>

          {/* Server Privacy */}
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Server Privacy
            </label>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.is_public === true}
                  onChange={() => handleInputChange('is_public', true)}
                  className={`mt-1 w-4 h-4 text-primary ${
                    isDarkMode ? 'border-slate-600' : 'border-gray-300'
                  } focus:ring-primary/50 focus:ring-2`}
                />
                <div>
                  <div className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Public Server</div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Anyone can discover and join this server
                  </div>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.is_public === false}
                  onChange={() => handleInputChange('is_public', false)}
                  className={`mt-1 w-4 h-4 text-primary ${
                    isDarkMode ? 'border-slate-600' : 'border-gray-300'
                  } focus:ring-primary/50 focus:ring-2`}
                />
                <div>
                  <div className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Private Server</div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Only people with an invite link can join
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Guidelines */}
          <div className={`p-4 ${
            isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50/30'
          } rounded-xl`}>
            <h4 className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            } mb-2`}>Community Guidelines</h4>
            <ul className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            } space-y-1`}>
              <li>• Keep discussions respectful and on-topic</li>
              <li>• No spam or self-promotion without permission</li>
              <li>• Follow anime community standards</li>
              <li>• Be welcoming to new members</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              } border rounded-xl font-medium transition-all duration-200`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || submitting}
              className={`flex-1 px-4 py-3 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 ${
                isDarkMode
                  ? 'bg-primary text-white'
                  : 'bg-primary text-black'
              }`}
            >
              {submitting ? (
                <>
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${
                    isDarkMode ? 'border-white' : 'border-black'
                  }`}></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Server</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 