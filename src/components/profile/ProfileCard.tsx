'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import ProfileEditForm from './ProfileEditForm'
import AvatarUpload from './AvatarUpload'
import { Profile } from '@/src/types/profile'
import { useDarkMode } from '@/src/hooks/useDarkMode'

interface ProfileCardProps {
  user: User
  profile: Profile | null
  onProfileUpdate?: (updatedProfile: Profile) => void
}

export default function ProfileCard({ user, profile, onProfileUpdate }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [statusText, setStatusText] = useState(profile?.status || '')
  const [statusLoading, setStatusLoading] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioText, setBioText] = useState(profile?.bio || '')
  const [bioLoading, setBioLoading] = useState(false)
  
  const { isDarkMode, mounted } = useDarkMode()

  // Sync local state when profile prop changes
  useEffect(() => {
    setStatusText(profile?.status || '')
    setBioText(profile?.bio || '')
  }, [profile?.status, profile?.bio])

  const handleStatusUpdate = async () => {
    setStatusLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: statusText,
          // Include current profile data to avoid overwriting
          username: profile?.username,
          displayName: profile?.displayName,
          bio: profile?.bio,
          favoriteAnime: profile?.favoriteAnime,
          avatarUrl: profile?.avatarUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const updatedProfile = await response.json()
      
      // Update local state instead of page refresh
      setIsEditingStatus(false)
      if (onProfileUpdate && profile) {
        onProfileUpdate({
          ...profile,
          status: statusText,
          updatedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      // Reset to original value on error
      setStatusText(profile?.status || '')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleStatusCancel = () => {
    setStatusText(profile?.status || '')
    setIsEditingStatus(false)
  }

  const handleBioUpdate = async () => {
    setBioLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bio: bioText,
          // Include current profile data to avoid overwriting
          username: profile?.username,
          displayName: profile?.displayName,
          status: profile?.status,
          favoriteAnime: profile?.favoriteAnime,
          avatarUrl: profile?.avatarUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update bio')
      }

      const updatedProfile = await response.json()
      
      // Update local state instead of page refresh
      setIsEditingBio(false)
      if (onProfileUpdate && profile) {
        onProfileUpdate({
          ...profile,
          bio: bioText,
          updatedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error updating bio:', error)
      // Reset to original value on error
      setBioText(profile?.bio || '')
    } finally {
      setBioLoading(false)
    }
  }

  const handleBioCancel = () => {
    setBioText(profile?.bio || '')
    setIsEditingBio(false)
  }

  if (isEditing) {
    return (
      <ProfileEditForm
        user={user}
        profile={profile}
        onCancel={() => setIsEditing(false)}
        onSave={() => setIsEditing(false)}
      />
    )
  }

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
    )
  }

  // Dark mode state is now managed in useEffect above

  return (
    <div className={`backdrop-blur-xl rounded-2xl p-6 flex flex-col transition-all duration-300 hover:bg-opacity-60 container-integrated ${
      isDarkMode 
        ? 'bg-gray-800/40 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] shadow-gray-900/20 hover:shadow-gray-900/30' 
        : 'bg-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shadow-gray-900/5 hover:shadow-gray-900/10'
    } ${isEditingBio ? 'h-[500px]' : 'h-96'}`}>
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-semibold ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>Profile</h2>
        <div className="flex space-x-2">
        <button
          onClick={() => setIsEditing(true)}
          className={`p-2 transition-colors rounded-full backdrop-blur-sm ${
            isDarkMode
              ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/60'
              : 'text-gray-400 hover:text-gray-600 hover:bg-white/60'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button className={`p-2 transition-colors rounded-full backdrop-blur-sm ${
          isDarkMode
            ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/60'
            : 'text-gray-400 hover:text-gray-600 hover:bg-white/60'
        }`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </button>
        </div>
      </div>

      {/* Profile content - using flex-1 and proper overflow handling */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top section with avatar and status */}
        <div className="flex items-start space-x-4 mb-6">
          {/* Avatar with username below */}
          <div className="flex-shrink-0 text-center">
            <div className="mb-2">
              <AvatarUpload 
                profile={profile} 
                onAvatarUpdate={(avatarUrl) => {
                  // Handle avatar update - could update local state here
                  // but we're refreshing the page for now
                }} 
              />
            </div>
            
            {/* Display name and username below avatar */}
            <div className="text-center">
              <div className={`text-sm font-semibold mb-1 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {profile?.displayName || profile?.username || 'User'}
              </div>
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 rounded-lg px-2 py-1 inline-block">
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  @{profile?.username || 'username'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile info */}
          <div className="flex-1 min-w-0">
            {/* Status message */}
            <div className="mb-3">
              {isEditingStatus ? (
                <div className={`backdrop-blur-sm border-2 border-blue-500/50 rounded-2xl px-4 py-3 max-w-full ${
                  isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
                }`}>
                  <div className="flex items-start space-x-2 group">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-blue-500 group-hover:text-purple-500 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={statusText}
                        onChange={(e) => setStatusText(e.target.value)}
                        className={`w-full text-sm bg-transparent border-none outline-none group-hover:placeholder-purple-400 transition-colors duration-300 ${
                          isDarkMode 
                            ? 'text-gray-100 placeholder-gray-500' 
                            : 'text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Share what you're watching or thinking about anime..."
                        maxLength={100}
                        autoFocus
                        disabled={statusLoading}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>{statusText.length}/100</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleStatusCancel}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-gray-200' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                            disabled={statusLoading}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleStatusUpdate}
                            className={`text-xs px-2 py-1 rounded transition-colors backdrop-blur-sm disabled:opacity-50 ${
                              isDarkMode
                                ? 'text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50'
                                : 'text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100/50'
                            }`}
                            disabled={statusLoading}
                          >
                            {statusLoading ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className={`rounded-2xl px-4 py-3 inline-block max-w-full relative cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                    profile?.status && profile.status.trim() !== '' 
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-gray-700/60 to-gray-600/60 hover:from-gray-600/70 hover:to-gray-500/70 border border-gray-600/30'
                        : 'bg-gradient-to-r from-gray-200/60 to-gray-300/60 hover:from-gray-300/70 hover:to-gray-400/70 border border-gray-300/30'
                      : isDarkMode
                        ? 'bg-gray-800/60 border-2 border-dashed border-gray-600/50 hover:border-gray-500/60'
                        : 'bg-gray-100/60 border-2 border-dashed border-gray-300/50 hover:border-gray-400/60'
                  }`}
                  onClick={() => setIsEditingStatus(true)}
                >
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className={`w-3 h-3 ${
                        profile?.status && profile.status.trim() !== '' 
                          ? isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className={`text-sm break-words flex-1 ${
                      profile?.status && profile.status.trim() !== '' 
                        ? isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        : isDarkMode ? 'text-gray-400 italic' : 'text-gray-500 italic'
                    }`}>
                      {profile?.status && profile.status.trim() !== '' 
                        ? profile.status 
                        : 'Click to share what you\'re watching or thinking about anime...'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bio Section - with proper overflow handling */}
        <div className="pt-4 flex-1 flex flex-col min-h-0">
          <h3 className={`text-sm font-semibold mb-3 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Bio</h3>
          <div className="flex-1 flex flex-col min-h-0">
            {isEditingBio ? (
              <div className={`backdrop-blur-sm border-2 border-purple-500/50 hover:border-purple-500/70 rounded-xl p-4 flex flex-col h-full group transition-all duration-300 ${
                isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}>
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className={`w-full text-sm bg-transparent border-none outline-none group-hover:placeholder-purple-400 resize-none flex-1 min-h-0 transition-colors duration-300 ${
                    isDarkMode
                      ? 'text-gray-100 placeholder-gray-500'
                      : 'text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="Tell everyone about your anime journey, favorite genres, or what you're currently watching..."
                  maxLength={500}
                  autoFocus
                  disabled={bioLoading}
                />
                <div className={`flex items-center justify-between mt-3 pt-3 border-t flex-shrink-0 ${
                  isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'
                }`}>
                  <span className={`text-xs ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>{bioText.length}/500</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBioCancel}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                        isDarkMode
                          ? 'text-gray-400 hover:text-gray-200'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      disabled={bioLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBioUpdate}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors backdrop-blur-sm disabled:opacity-50 ${
                        isDarkMode
                          ? 'text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50'
                          : 'text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100/50'
                      }`}
                      disabled={bioLoading}
                    >
                      {bioLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className={`rounded-xl px-4 py-3 h-full cursor-pointer transition-all duration-300 overflow-y-auto backdrop-blur-sm ${
                  profile?.bio && profile.bio.trim() !== '' 
                    ? isDarkMode
                      ? 'bg-gradient-to-br from-gray-800/70 to-gray-700/70 hover:from-gray-700/80 hover:to-gray-600/80 border border-gray-600/30'
                      : 'bg-gradient-to-br from-gray-50/70 to-gray-100/70 hover:from-gray-100/80 hover:to-gray-200/80 border border-gray-200/30'
                    : isDarkMode
                      ? 'bg-gray-800/60 border-2 border-dashed border-gray-600/50 hover:border-gray-500/60'
                      : 'bg-gray-50/60 border-2 border-dashed border-gray-300/50 hover:border-gray-400/60'
                }`}
                onClick={() => {
                  setBioText(profile?.bio || '')
                  setIsEditingBio(true)
                }}
              >
                <div className={`text-sm leading-relaxed whitespace-pre-line ${
                  profile?.bio && profile.bio.trim() !== '' 
                    ? isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    : isDarkMode ? 'text-gray-400 italic' : 'text-gray-500 italic'
                }`}>
                  {profile?.bio && profile.bio.trim() !== '' 
                    ? profile.bio 
                    : 'Click to tell everyone about your anime journey, favorite genres, or what you\'re currently watching...'
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 