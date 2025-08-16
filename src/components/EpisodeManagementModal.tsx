'use client'

import { useState, useEffect } from 'react'
import { HeartIcon as HeartSolid, TrashIcon } from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { useDarkMode } from '@/src/hooks/useDarkMode'

interface Anime {
  id: string
  title: string
  imageUrl: string
  episodes?: number
  score?: number
  year?: number
  synopsis?: string
}

interface EpisodeManagementModalProps {
  anime: Anime
  status: string
  progress: number
  isOpen: boolean
  onClose: () => void
  onStatusChange: (status: string) => void
  onProgressChange: (progress: number) => void
  onFavoriteToggle?: () => void
  onRemove?: () => void
  isFavorite?: boolean
}

export default function EpisodeManagementModal({
  anime,
  status,
  progress,
  isOpen,
  onClose,
  onStatusChange,
  onProgressChange,
  onFavoriteToggle,
  onRemove,
  isFavorite = false,
}: EpisodeManagementModalProps) {
  const { isDarkMode } = useDarkMode()
  const [localStatus, setLocalStatus] = useState(status)
  const [localProgress, setLocalProgress] = useState(progress)

  useEffect(() => {
    setLocalStatus(status)
    setLocalProgress(progress)
  }, [status, progress])

  // Sync local state when the modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalStatus(status)
      setLocalProgress(progress)
    }
  }, [isOpen, status, progress])

  const handleStatusChange = (newStatus: string) => {
    setLocalStatus(newStatus)
    
    // Auto-adjust progress based on status BEFORE calling the parent handlers
    let newProgress = localProgress;
    if (newStatus === 'completed' && anime.episodes) {
      newProgress = anime.episodes;
      setLocalProgress(anime.episodes);
    } else if (newStatus === 'plan_to_watch') {
      newProgress = 0;
      setLocalProgress(0);
    }
    
    // Call parent handlers with the new values
    onStatusChange(newStatus)
    if (newProgress !== localProgress) {
      onProgressChange(newProgress)
    }
  }

  const handleProgressChange = (newProgress: number) => {
    setLocalProgress(newProgress)
    onProgressChange(newProgress)
    
    // Auto-complete if reached max episodes
    if (anime.episodes && newProgress === anime.episodes && localStatus !== 'completed') {
      setLocalStatus('completed')
      onStatusChange('completed')
    } else if (newProgress > 0 && localStatus === 'plan_to_watch') {
      setLocalStatus('watching')
      onStatusChange('watching')
    }
  }

  const decrementProgress = () => {
    if (localProgress > 0) {
      handleProgressChange(localProgress - 1)
    }
  }

  const incrementProgress = () => {
    if (!anime.episodes || localProgress < anime.episodes) {
      handleProgressChange(localProgress + 1)
    }
  }

  const setProgressTo = (value: number) => {
    const newProgress = Math.max(0, Math.min(value, anime.episodes || 999))
    handleProgressChange(newProgress)
  }

  const progressPercentage = anime.episodes ? (localProgress / anime.episodes) * 100 : 0

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
        } max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Anime Info */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
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

          {/* Status Selection */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Watch Status
            </label>
            <select
              value={localStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-100'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            >
              <option value="plan_to_watch">Plan to Watch</option>
              <option value="watching">Watching</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          {/* Episode Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Episode Progress
              </label>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {localProgress} / {anime.episodes || '?'}
              </span>
            </div>

            {/* Large Progress Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={decrementProgress}
                disabled={localProgress === 0}
                className={`py-3 px-3 rounded-lg text-base font-bold transition-all duration-200 ${
                  localProgress === 0
                    ? isDarkMode 
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-800'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
                }`}
              >
                -1
              </button>
              
              <input
                type="number"
                min="0"
                max={anime.episodes || 999}
                value={localProgress}
                onChange={(e) => setProgressTo(Number(e.target.value) || 0)}
                className={`py-3 px-3 text-center text-base font-bold border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                style={{ MozAppearance: 'textfield' }}
              />
              
              <button
                onClick={incrementProgress}
                disabled={anime.episodes ? localProgress >= anime.episodes : false}
                className={`py-3 px-3 rounded-lg text-base font-bold transition-all duration-200 ${
                  anime.episodes && localProgress >= anime.episodes
                    ? isDarkMode 
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-blue-700 text-blue-300 hover:bg-blue-600 active:bg-blue-800'
                      : 'bg-blue-200 text-blue-700 hover:bg-blue-300 active:bg-blue-400'
                }`}
              >
                +1
              </button>
            </div>

            {/* Quick Episode Buttons - Hidden on mobile */}
            {anime.episodes && anime.episodes > 5 && (
              <div className="hidden md:grid grid-cols-2 gap-2">
                {[
                  { label: 'Start (1)', value: 1 },
                  { label: 'All (' + anime.episodes + ')', value: anime.episodes },
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setProgressTo(option.value)}
                    className={`py-1.5 px-2 rounded text-xs font-medium transition-all duration-200 ${
                      localProgress === option.value
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {/* Progress Bar */}
            <div className={`w-full rounded-full h-2 overflow-hidden ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-3 border-t border-gray-200/20">
            {/* Favorite Button */}
            {onFavoriteToggle && (
              <button
                onClick={onFavoriteToggle}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 ${
                  isFavorite
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isFavorite ? (
                  <HeartSolid className="w-4 h-4" />
                ) : (
                  <HeartOutline className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {isFavorite ? 'Favorited' : 'Favorite'}
                </span>
              </button>
            )}

            {/* Remove Button */}
            {onRemove && (
              <button
                onClick={() => {
                  onRemove()
                  onClose()
                }}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
