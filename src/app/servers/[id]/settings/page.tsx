'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/src/components/layout/Header';
import { getServer, updateServer, regenerateInviteCode } from '@/src/lib/server-service';
import type { ServerWithDetails } from '@/src/types/server';
import { useDarkMode } from '@/src/hooks/useDarkMode';
import { PhotoIcon, KeyIcon, ShieldCheckIcon, UserGroupIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/src/lib/supabase/client';

export default function ServerSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.id as string;
  const [server, setServer] = useState<ServerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const { isDarkMode, mounted } = useDarkMode();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true,
  });

  useEffect(() => {
    loadServer();
  }, [serverId]);

  const loadServer = async () => {
    try {
      setLoading(true);
      const serverData = await getServer(serverId);
      if (!serverData) {
        setError('Server not found');
        return;
      }

      // Check if current user is owner
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userIsOwner = user?.id === serverData.owner_id;
      setIsOwner(userIsOwner);

      if (!userIsOwner) {
        setError('You do not have permission to access server settings');
        return;
      }

      setServer(serverData);
      setFormData({
        name: serverData.name,
        description: serverData.description || '',
        is_public: serverData.is_public,
      });
    } catch (error) {
      console.error('Error loading server:', error);
      setError('Failed to load server');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!server || !isOwner) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedServer = await updateServer(serverId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_public: formData.is_public,
      });

      if (updatedServer) {
        setServer({ ...server, ...updatedServer });
        setSuccess('Server settings updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update server settings');
      }
    } catch (error) {
      console.error('Error updating server:', error);
      setError('Failed to update server settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const generateNewInviteCode = async () => {
    if (!server || !isOwner) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const result = await regenerateInviteCode(server.id);
      
      if (result.success && result.invite_code) {
        // Update the server state with new invite code
        setServer(prev => prev ? { ...prev, invite_code: result.invite_code } : null);
        setSuccess('New invite code generated successfully');
      setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to generate new invite code');
      }
    } catch (error) {
      console.error('Error generating new invite code:', error);
      setError('Failed to generate new invite code');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen smooth-gradient transition-all duration-500">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen smooth-gradient transition-all duration-500">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading server settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !server) {
    return (
      <div className="min-h-screen smooth-gradient transition-all duration-500">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 ${
              isDarkMode ? 'bg-red-900/20' : 'bg-red-100'
            } rounded-full flex items-center justify-center mx-auto`}>
              <ShieldCheckIcon className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              } mb-2`}>Access Denied</h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{error}</p>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen smooth-gradient transition-all duration-500">
      <Header />
      
      <div className="content-wrapper section-padding py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => router.back()}
              className={`p-2 ${
                isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
              } rounded-lg transition-colors duration-200`}
            >
              <ArrowLeftIcon className={`w-5 h-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Server Settings
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage {server?.name} server configuration
              </p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckIcon className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Form */}
            <div className="lg:col-span-2">
              <div className={`${
                isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-gray-200'
              } rounded-xl border backdrop-blur-sm p-6`}>
                <h2 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                } mb-6`}>
                  General Settings
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Server Icon */}
                  <div className="space-y-3">
                    <label className={`block text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Server Icon
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className={`w-20 h-20 ${
                        isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100'
                      } rounded-2xl flex items-center justify-center border-2 border-dashed ${
                        isDarkMode ? 'border-slate-600' : 'border-gray-300'
                      } transition-colors duration-200 hover:border-primary cursor-pointer group`}>
                        {server?.icon_url ? (
                          <img
                            src={server.icon_url}
                            alt={server.name}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <PhotoIcon className={`w-8 h-8 ${
                            isDarkMode ? 'text-slate-500 group-hover:text-primary' : 'text-gray-400 group-hover:text-primary'
                          } transition-colors duration-200`} />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          Upload an image for your server
                        </p>
                        <button
                          type="button"
                          className={`text-sm ${
                            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                          } transition-colors duration-200`}
                        >
                          Choose Image
                        </button>
                      </div>
                    </div>
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
                      className={`w-full p-3 ${
                        isDarkMode 
                          ? 'bg-slate-700/60 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-gray-50/60 border-gray-300 text-gray-900 placeholder-gray-500'
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
                      className={`w-full p-3 ${
                        isDarkMode 
                          ? 'bg-slate-700/60 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-gray-50/60 border-gray-300 text-gray-900 placeholder-gray-500'
                      } border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none`}
                      rows={3}
                      maxLength={500}
                      placeholder="Describe your server..."
                    />
                    <p className={`text-xs ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      {formData.description.length}/500 characters
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

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving || !formData.name.trim()}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Server Info Sidebar */}
            <div className="space-y-6">
              {/* Server Stats */}
              <div className={`${
                isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-gray-200'
              } rounded-xl border backdrop-blur-sm p-6`}>
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                } mb-4`}>
                  Server Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${
                      isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
                    } rounded-lg flex items-center justify-center`}>
                      <UserGroupIcon className={`w-5 h-5 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>Members</p>
                      <p className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{server?.member_count || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${
                      isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
                    } rounded-lg flex items-center justify-center`}>
                      <KeyIcon className={`w-5 h-5 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>Server ID</p>
                      <p className={`font-mono text-xs ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{server?.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invite Code Management */}
              <div className={`${
                isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-gray-200'
              } rounded-xl border backdrop-blur-sm p-6`}>
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                } mb-4`}>
                  Invite Code
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 ${
                    isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
                  } rounded-lg`}>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-500'
                    } mb-1`}>Current Code</p>
                    <p className={`font-mono text-lg ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{server?.invite_code}</p>
                  </div>
                  <button
                    onClick={generateNewInviteCode}
                    disabled={saving}
                    className={`w-full px-4 py-2 ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' 
                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                    } border rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50`}
                  >
                    Generate New Code
                  </button>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    This will invalidate the current invite link
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 