'use client';

import { useState } from 'react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { joinServer, searchServers } from '../../lib/server-service';
import type { Server, JoinServerRequest } from '../../types/server';
import { useDarkMode } from '../../hooks/useDarkMode';

interface JoinServerModalProps {
  onClose: () => void;
  onServerJoined: (server: Server) => void;
}

export function JoinServerModal({ onClose, onServerJoined }: JoinServerModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicServers, setPublicServers] = useState<Server[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [showPublicServers, setShowPublicServers] = useState(false);
  const { isDarkMode, mounted } = useDarkMode();

  if (!mounted) {
    return null;
  }

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const success = await joinServer({ invite_code: inviteCode.trim() });

      if (success) {
        // Since joinServer doesn't return the server, we'll close the modal
        // and let the parent component refresh the server list
        onClose();
        // You might want to show a success message here
      } else {
        setError('Invalid invite code or server not found');
      }
    } catch (error) {
      console.error('Error joining server:', error);
      setError('Failed to join server. Please check the invite code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadPublicServers = async () => {
    try {
      setLoadingPublic(true);
      const servers = await searchServers({ 
        sort_by: 'member_count',
        sort_order: 'desc'
      });
      setPublicServers(servers);
      setShowPublicServers(true);
    } catch (error) {
      console.error('Error loading public servers:', error);
      setError('Failed to load public servers');
    } finally {
      setLoadingPublic(false);
    }
  };

  const handleJoinPublicServer = async (server: Server) => {
    if (!server.invite_code) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const success = await joinServer({ invite_code: server.invite_code });

      if (success) {
        onServerJoined(server);
      } else {
        setError('Failed to join server');
      }
    } catch (error) {
      console.error('Error joining server:', error);
      setError('Failed to join server');
    } finally {
      setSubmitting(false);
    }
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
          }`}>Join a Server</h2>
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
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Join with Invite Code */}
          <form onSubmit={handleJoinWithCode} className="space-y-4">
            <div>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              } mb-3`}>Join with Invite Code</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="inviteCode" className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  } mb-1`}>
                    Invite Code
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code (e.g., ABC123)"
                    className={`w-full p-3 ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    } border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200`}
                    disabled={submitting}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!inviteCode.trim() || submitting}
                  className="w-full px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <span>Join Server</span>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className={`absolute inset-0 flex items-center ${
              isDarkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              <div className={`w-full border-t ${
                isDarkMode ? 'border-slate-600' : 'border-gray-300'
              }`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`${
                isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-500'
              } px-2`}>
                OR
              </span>
            </div>
          </div>

          {/* Browse Public Servers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Browse Public Servers
              </h3>
              {!showPublicServers && (
                <button
                  onClick={handleLoadPublicServers}
                  disabled={loadingPublic}
                  className={`px-3 py-1 text-sm ${
                    isDarkMode 
                      ? 'text-blue-400 hover:text-blue-300' 
                      : 'text-blue-600 hover:text-blue-500'
                  } transition-colors duration-200`}
                >
                  {loadingPublic ? 'Loading...' : 'Show Servers'}
                </button>
              )}
            </div>

            {showPublicServers && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {publicServers.length === 0 ? (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No public servers found</p>
                  </div>
                ) : (
                  publicServers.map((server) => (
                    <div
                      key={server.id}
                      className={`p-3 ${
                        isDarkMode 
                          ? 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } border rounded-lg transition-colors duration-200 cursor-pointer`}
                      onClick={() => handleJoinPublicServer(server)}
                    >
                      <div className="flex items-center space-x-3">
                        {server.icon_url ? (
                          <img
                            src={server.icon_url}
                            alt={server.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <UserGroupIcon className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium truncate ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {server.name}
                          </h4>
                          <p className={`text-xs truncate ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            {server.member_count} members
                          </p>
                        </div>
                      </div>
                      {server.description && (
                        <p className={`mt-2 text-xs line-clamp-2 ${
                          isDarkMode ? 'text-slate-300' : 'text-gray-600'
                        }`}>
                          {server.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 