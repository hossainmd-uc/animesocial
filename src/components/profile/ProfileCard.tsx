'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import ProfileEditForm from './ProfileEditForm'

interface Profile {
  id: string
  username?: string
  full_name?: string
  bio?: string
  favorite_anime?: string
  avatar_url?: string
  created_at: string
}

interface ProfileCardProps {
  user: User
  profile: Profile | null
}

export default function ProfileCard({ user, profile }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)

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

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  className="h-16 w-16 rounded-full"
                  src={profile.avatar_url}
                  alt="Profile"
                />
              ) : (
                <span className="text-xl font-medium text-gray-600">
                  {(profile?.full_name || user.email)?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              {profile?.full_name || 'Anime Fan'}
            </h3>
            <p className="text-sm text-gray-500">
              @{profile?.username || 'new_user'}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {profile?.bio || 'No bio yet - add one to tell others about your anime preferences!'}
          </p>
        </div>
        
        {profile?.favorite_anime && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">Favorite Anime:</p>
            <p className="text-sm text-gray-600">{profile.favorite_anime}</p>
          </div>
        )}
        
        <div className="mt-4">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
} 