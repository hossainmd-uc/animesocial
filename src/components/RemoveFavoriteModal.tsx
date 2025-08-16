'use client'

import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { useDarkMode } from '@/src/hooks/useDarkMode'

interface Anime {
  id: string
  title: string
  imageUrl: string
  episodes?: number
  score?: number
  year?: number
}

interface RemoveFavoriteModalProps {
  anime: Anime
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function RemoveFavoriteModal({
  anime,
  isOpen,
  onClose,
  onConfirm,
}: RemoveFavoriteModalProps) {
  const { isDarkMode } = useDarkMode()

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-xs rounded-2xl shadow-2xl backdrop-blur-xl border ${
          isDarkMode
            ? 'bg-slate-900/95 border-slate-700/50'
            : 'bg-white/95 border-gray-200/50'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <HeartSolid className="w-8 h-8 text-red-500" />
          </div>

          {/* Title */}
          <h3 className={`text-lg font-bold mb-2 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Remove from Favorites?
          </h3>

          {/* Anime Info */}
          <div className="flex items-center space-x-3 mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <img
              src={anime.imageUrl}
              alt={anime.title}
              className="w-10 h-12 object-cover rounded"
            />
            <div className="flex-1 text-left min-w-0">
              <p className={`font-medium text-sm leading-tight ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {anime.title}
              </p>
              {anime.episodes && (
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {anime.episodes} episodes
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          <p className={`text-sm mb-6 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            This anime will be removed from your favorites list.
          </p>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 bg-red-500 text-white hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
