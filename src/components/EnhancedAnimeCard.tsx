'use client'

import { useState } from 'react'
import { HeartIcon as HeartSolid, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutline, EyeIcon } from '@heroicons/react/24/outline'
import AnimeDetailsModal from './AnimeDetailsModal'
import { useDarkMode } from '@/src/hooks/useDarkMode'

export interface Anime {
  id: string
  title: string
  imageUrl: string
  episodes?: number
  score?: number
  year?: number
  synopsis?: string
}

export interface EnhancedAnimeCardProps {
  anime: Anime
  status?: string
  progress?: number
  isFavorite?: boolean
  isInWatchlist?: boolean
  onStatusChange?: (status: string) => void
  onProgressChange?: (progress: number) => void
  onFavoriteToggle?: () => void
  onWatchlistToggle?: () => void
  onRemove?: () => void
  variant?: 'browse' | 'watchlist'
}

export default function EnhancedAnimeCard({
  anime,
  status,
  progress = 0,
  isFavorite = false,
  isInWatchlist = false,
  onStatusChange,
  onProgressChange,
  onFavoriteToggle,
  onWatchlistToggle,
  onRemove,
  variant = 'browse',
}: EnhancedAnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [statusValue, setStatusValue] = useState(status || 'Plan to Watch')
  const [progressValue, setProgressValue] = useState(progress)
  const { isDarkMode, mounted } = useDarkMode()

  const handleStatusSubmit = () => {
    onStatusChange?.(statusValue)
  }

  const handleProgressSubmit = () => {
    onProgressChange?.(progressValue)
  }

  if (!mounted) {
    return (
      <div className="relative bg-white/80 rounded-2xl overflow-hidden shadow-lg border border-gray-200/40 animate-pulse">
        <div className="aspect-[3/4] bg-gray-200"></div>
        <div className="p-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const progressPercentage = anime.episodes ? (progressValue / anime.episodes) * 100 : 0

  return (
    <>
      <div 
        className={`group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-out card-hover border cursor-pointer backdrop-blur-sm ${
          isDarkMode
            ? 'bg-slate-800/80 border-slate-700/40'
            : 'bg-white/80 border-gray-200/40'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowModal(true)}
      >
        {/* Anime Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={anime.imageUrl}
            alt={anime.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Score Badge */}
          {anime.score && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1">
              <span>⭐</span>
              <span>{anime.score}</span>
            </div>
          )}
          
          {/* Progress Bar - Only show if there's progress */}
          {progressValue > 0 && anime.episodes && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
          
          {/* Action Buttons Overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center space-x-3">
              {/* Favorite Button */}
              <button
                onClick={onFavoriteToggle}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 hover:bg-white/30 hover:scale-110 transition-all duration-300 group/btn"
              >
                {isFavorite ? (
                  <HeartSolid className="w-5 h-5 text-red-500 group-hover/btn:scale-110 transition-transform duration-300" />
                ) : (
                  <HeartOutline className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform duration-300" />
                )}
              </button>
              
              {/* Remove Button for Watchlist Mode - Right of Favorite */}
              {variant === 'watchlist' && onRemove && (
                <button
                  onClick={onRemove}
                  className="p-3 bg-red-500/80 backdrop-blur-md rounded-full border border-red-400/30 hover:bg-red-600/90 hover:scale-110 transition-all duration-300 group/btn"
                  title="Remove from watchlist"
                >
                  <XMarkIcon className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform duration-300" />
                </button>
              )}
              
              {/* Watchlist Button (only for browse mode) */}
              {variant === 'browse' && onWatchlistToggle && (
                <button
                  onClick={onWatchlistToggle}
                  className={`p-3 backdrop-blur-md rounded-full border hover:scale-110 transition-all duration-300 group/btn ${
                    isInWatchlist
                      ? 'bg-green-500/80 border-green-400/30 hover:bg-green-600/90'
                      : 'bg-white/20 border-white/30 hover:bg-white/30'
                  }`}
                >
                  {isInWatchlist ? (
                    <EyeIcon className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform duration-300" />
                  ) : (
                    <PlusIcon className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform duration-300" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <h3 className={`font-bold line-clamp-2 text-sm leading-tight group-hover:text-blue-600 transition-colors duration-300 ${
            isDarkMode 
              ? 'text-gray-100 group-hover:text-blue-400' 
              : 'text-gray-900 group-hover:text-blue-600'
          }`}>
            {anime.title}
          </h3>
          
          <div className="flex items-center justify-between text-xs">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {anime.episodes && `${anime.episodes} episodes`}
              {anime.year && ` • ${anime.year}`}
            </p>
          </div>

          {/* Quick Actions for Watchlist Items */}
          {variant === 'watchlist' && (
            <div className="space-y-2 pt-2 border-t border-gray-200/50">
              {/* Status Dropdown */}
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                onBlur={handleStatusSubmit}
                className={`w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-100'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="Plan to Watch">Plan to Watch</option>
                <option value="Watching">Watching</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Dropped">Dropped</option>
              </select>

              {/* Progress Input */}
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="0"
                  max={anime.episodes || 999}
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  onBlur={handleProgressSubmit}
                  className={`flex-1 p-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  / {anime.episodes || '?'}
                </span>
                <button
                  onClick={handleProgressSubmit}
                  className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-all duration-300 btn-animate ${
                    isDarkMode
                      ? 'text-blue-400 hover:bg-blue-900/30'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <span>Update</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className={`w-full rounded-full h-2 overflow-hidden ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AnimeDetailsModal
          anime={anime}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          isFavorite={isFavorite}
          isInWatchlist={isInWatchlist}
          onFavoriteToggle={onFavoriteToggle}
          onWatchlistToggle={onWatchlistToggle}
        />
      )}
    </>
  )
} 