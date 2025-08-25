'use client';

import Avatar from '../ui/Avatar';
import { useDarkMode } from '@/src/hooks/useDarkMode';

interface ProfileViewCardProps {
  profileData: {
    id: string;
    username: string;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    status?: string | null;
    createdAt: string;
  };
}

export default function ProfileViewCard({ profileData }: ProfileViewCardProps) {
  const { isDarkMode, mounted } = useDarkMode();

  if (!mounted) {
    return (
      <div className={`backdrop-blur-xl rounded-2xl p-6 flex flex-col h-96 animate-pulse container-integrated ${
        isDarkMode 
          ? 'bg-gray-800/40 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] shadow-gray-900/20' 
          : 'bg-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shadow-gray-900/5'
      }`}>
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="flex-1 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`backdrop-blur-xl rounded-2xl p-6 flex flex-col transition-all duration-300 container-integrated h-96 ${
      isDarkMode 
        ? 'bg-gray-800/40 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] shadow-gray-900/20' 
        : 'bg-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shadow-gray-900/5'
    }`}>
      {/* Header with title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-semibold ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>Profile</h2>
      </div>

      {/* Profile content - using flex-1 and proper overflow handling */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top section with avatar and status */}
        <div className="flex items-start space-x-4 mb-6">
          {/* Avatar with username below */}
          <div className="flex-shrink-0 text-center">
            <div className="mb-2">
              <Avatar
                src={profileData.avatarUrl}
                username={profileData.username}
                size="lg"
              />
            </div>
            
            {/* Display name and username below avatar */}
            <div className="text-center">
              <div className={`text-sm font-semibold mb-1 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {profileData.displayName || profileData.username}
              </div>
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 rounded-lg px-2 py-1 inline-block">
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  @{profileData.username}
                </span>
              </div>
            </div>
          </div>

          {/* Profile info */}
          <div className="flex-1 min-w-0">
            {/* Status message */}
            <div className="mb-3">
              <div className={`rounded-2xl px-4 py-3 inline-block max-w-full relative backdrop-blur-sm ${
                profileData?.status && profileData.status.trim() !== '' 
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-gray-700/60 to-gray-600/60 border border-gray-600/30'
                    : 'bg-gradient-to-r from-gray-200/60 to-gray-300/60 border border-gray-300/30'
                  : isDarkMode
                    ? 'bg-gray-800/60 border-2 border-dashed border-gray-600/50'
                    : 'bg-gray-100/60 border-2 border-dashed border-gray-300/50'
              }`}>
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className={`w-3 h-3 ${
                      profileData?.status && profileData.status.trim() !== '' 
                        ? isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={`text-sm break-words flex-1 ${
                    profileData?.status && profileData.status.trim() !== '' 
                      ? isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      : isDarkMode ? 'text-gray-400 italic' : 'text-gray-500 italic'
                  }`}>
                    {profileData?.status && profileData.status.trim() !== '' 
                      ? profileData.status 
                      : 'No status message'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bio Section - with proper overflow handling */}
        <div className="pt-4 flex-1 flex flex-col min-h-0">
          <h3 className={`text-sm font-semibold mb-3 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Bio</h3>
          <div className="flex-1 flex flex-col min-h-0">
            <div className={`rounded-xl px-4 py-3 h-full overflow-y-auto backdrop-blur-sm ${
              profileData?.bio && profileData.bio.trim() !== '' 
                ? isDarkMode
                  ? 'bg-gradient-to-br from-gray-800/70 to-gray-700/70 border border-gray-600/30'
                  : 'bg-gradient-to-br from-gray-50/70 to-gray-100/70 border border-gray-200/30'
                : isDarkMode
                  ? 'bg-gray-800/60 border-2 border-dashed border-gray-600/50'
                  : 'bg-gray-50/60 border-2 border-dashed border-gray-300/50'
            }`}>
              <div className={`text-sm leading-relaxed whitespace-pre-line ${
                profileData?.bio && profileData.bio.trim() !== '' 
                  ? isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  : isDarkMode ? 'text-gray-400 italic' : 'text-gray-500 italic'
              }`}>
                {profileData?.bio && profileData.bio.trim() !== '' 
                  ? profileData.bio 
                  : 'No bio available'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
