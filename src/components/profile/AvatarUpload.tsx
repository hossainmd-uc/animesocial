'use client'

import React, { useState, useRef } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Profile } from '@/src/types/profile'
import Avatar from '../ui/Avatar'

interface AvatarUploadProps {
  profile: Profile | null
  onAvatarUpdate: (avatarUrl: string | null) => void
}

export default function AvatarUpload({ profile, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      onAvatarUpdate(result.avatarUrl)
      
      // Refresh the page to show updated avatar
      window.location.reload()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAvatar = async () => {
    if (!profile?.avatarUrl) return

    setUploading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed')
      }

      onAvatarUpdate(null)
      
      // Refresh the page to show updated avatar
      window.location.reload()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setUploading(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative group">
      {/* Avatar Display */}
      <div className="relative">
        <Avatar
          src={profile?.avatarUrl}
          username={profile?.username || 'User'}
          size="xl"
          className="border-4 border-gray-300"
        />
        
        {/* Online status indicator */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
        
        {/* Upload overlay - shows on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          {uploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </div>
      </div>

      {/* Upload button overlay */}
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={triggerFileSelect}
          disabled={uploading}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-lg transition-colors disabled:opacity-50"
          title="Upload new avatar"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Delete button (only show if avatar exists) */}
      {profile?.avatarUrl && (
        <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDeleteAvatar}
            disabled={uploading}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors disabled:opacity-50"
            title="Remove avatar"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs z-10">
          {error}
        </div>
      )}
    </div>
  )
} 