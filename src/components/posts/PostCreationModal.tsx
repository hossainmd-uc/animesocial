import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { createPost } from '../../lib/server-service';
import type { ServerPost } from '../../types/server';
import { useDarkMode } from '../../hooks/useDarkMode';
import ImageUpload from '../common/ImageUpload';
import { useUser } from '../../hooks/useUser';

interface Props {
  serverId: string;
  channelId: string;
  onCreated: (post: ServerPost) => void;
  onClose: () => void;
}

export default function PostCreationModal({ serverId, channelId, onCreated, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, mounted } = useDarkMode();
  const { user } = useUser();

  if (!mounted) {
    return null;
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const newPost = await createPost({
        server_id: serverId,
        channel_id: channelId,
        title: title.trim() || undefined,
        content: content.trim(),
        image_url: imageUrl || undefined,
      });
      
      if (newPost) {
        onCreated(newPost);
        onClose();
      } else {
        setError('Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <Dialog.Panel className={`relative ${
        isDarkMode ? 'bg-slate-800/100' : 'bg-white/100'
      } rounded-xl p-6 w-full max-w-lg space-y-6 shadow-xl border ${
        isDarkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <Dialog.Title className={`text-lg font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Create Post</Dialog.Title>
        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full rounded-lg border ${
              isDarkMode 
                ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400' 
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            } px-3 py-2 text-sm outline-none focus:border-primary`}
          />
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className={`w-full rounded-lg border ${
              isDarkMode 
                ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400' 
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            } px-3 py-2 text-sm outline-none focus:border-primary resize-y`}
          />
          <ImageUpload
            onImageUploaded={(url) => setImageUrl(url)}
            onError={(error) => setError(error)}
            currentImageUrl={imageUrl || undefined}
            uploadOptions={{
              bucket: 'post',
              folder: user?.id || 'temp',
              maxSizeBytes: 5 * 1024 * 1024, // 5MB for post images
            }}
            label="Add Photo"
            disabled={loading}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onClose} 
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isDarkMode 
                ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className={`px-4 py-1 rounded transition-colors disabled:opacity-50 ${
              isDarkMode
                ? 'bg-primary hover:bg-primary/90 text-white'
                : 'bg-primary hover:bg-primary/90 text-black'
            }`}
          >
            {loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
} 