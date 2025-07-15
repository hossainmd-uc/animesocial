import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { createPost } from '../../lib/server-service';
import type { ServerPost } from '../../types/server';
import { useDarkMode } from '../../hooks/useDarkMode';

interface Props {
  serverId: string;
  channelId: string;
  onCreated: (post: ServerPost) => void;
  onClose: () => void;
}

export default function PostCreationModal({ serverId, channelId, onCreated, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isDarkMode, mounted } = useDarkMode();

  if (!mounted) {
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    let image_url: string | undefined;
    // TODO: upload to Supabase storage if needed; for now skip
    const newPost = await createPost({
      server_id: serverId,
      channel_id: channelId,
      title: title.trim() || undefined,
      content: content.trim(),
      image_url,
    });
    setLoading(false);
    if (newPost) {
      onCreated(newPost);
      onClose();
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
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Add Photo</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {previewUrl && <img src={previewUrl} alt="preview" className="mt-2 max-h-40 rounded-lg" />}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onClose} 
            className={`px-3 py-1 rounded text-sm ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="px-4 py-1 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
} 