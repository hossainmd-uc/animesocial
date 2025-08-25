'use client';

import { useState } from 'react';
import { useDarkMode } from '@/src/hooks/useDarkMode';
import { 
  XMarkIcon,
  ServerIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  HashtagIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Server {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  inviteCode: string;
  memberCount: number;
  postCount: number;
  channelCount: number;
  owner: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface ServerJoinModalProps {
  server: Server;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServerJoinModal({ server, isOpen, onClose }: ServerJoinModalProps) {
  const { isDarkMode } = useDarkMode();
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleJoinServer = async () => {
    setIsJoining(true);
    setJoinStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/servers/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invite_code: server.inviteCode,
        }),
      });

      if (response.ok) {
        setJoinStatus('success');
        // Redirect to server after a short delay
        setTimeout(() => {
          window.location.href = `/servers/${server.id}`;
        }, 1500);
      } else {
        const errorData = await response.json();
        setJoinStatus('error');
        setErrorMessage(errorData.error || 'Failed to join server');
      }
    } catch (error) {
      console.error('Error joining server:', error);
      setJoinStatus('error');
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsJoining(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl rounded-xl shadow-2xl transform transition-all ${
          isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Join Server
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Server Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
            }`}>
              {server.iconUrl ? (
                <img
                  src={server.iconUrl}
                  alt={server.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <ServerIcon className={`w-10 h-10 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {server.name}
              </h3>
              <p className={`text-sm mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Owned by {server.owner.displayName || server.owner.username}
              </p>
              {server.description && (
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {server.description}
                </p>
              )}
            </div>
          </div>

          {/* Server Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg text-center ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <div className={`flex items-center justify-center mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <div className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {server.memberCount}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Members
              </div>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <div className={`flex items-center justify-center mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <HashtagIcon className="w-6 h-6" />
              </div>
              <div className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {server.channelCount}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Channels
              </div>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <div className={`flex items-center justify-center mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <ChatBubbleLeftIcon className="w-6 h-6" />
              </div>
              <div className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {server.postCount}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Posts
              </div>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <div className={`flex items-center justify-center mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className={`text-xs font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Created
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatDate(server.createdAt)}
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {joinStatus === 'success' && (
            <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${
              isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
            }`}>
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
              <div>
                <p className={`font-medium ${
                  isDarkMode ? 'text-green-400' : 'text-green-800'
                }`}>
                  Successfully joined {server.name}!
                </p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  Redirecting to server...
                </p>
              </div>
            </div>
          )}

          {joinStatus === 'error' && (
            <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${
              isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
            }`}>
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
              <div>
                <p className={`font-medium ${
                  isDarkMode ? 'text-red-400' : 'text-red-800'
                }`}>
                  Failed to join server
                </p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-red-300' : 'text-red-600'
                }`}>
                  {errorMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            disabled={isJoining}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleJoinServer}
            disabled={isJoining || joinStatus === 'success'}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-primary hover:bg-primary/90 text-white'
                : 'bg-primary hover:bg-primary/90 text-black'
            } disabled:opacity-50`}
          >
            {isJoining ? 'Joining...' : joinStatus === 'success' ? 'Joined!' : 'Join Server'}
          </button>
        </div>
      </div>
    </div>
  );
}
