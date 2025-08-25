'use client'

import { useState, useEffect } from 'react'
import { HeartIcon as HeartSolid, PlusIcon } from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutline, EyeIcon } from '@heroicons/react/24/outline'
import { useDarkMode } from '@/src/hooks/useDarkMode'
import EpisodeManagementModal from './EpisodeManagementModal'
import RemoveFavoriteModal from './RemoveFavoriteModal'

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
  isFavoritesTab?: boolean
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
  isFavoritesTab = false,
}: EnhancedAnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [statusValue, setStatusValue] = useState(status || 'plan_to_watch')
  const [progressValue, setProgressValue] = useState(progress)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const { isDarkMode, mounted } = useDarkMode()

  const handleStatusChange = (newStatus: string) => {
    setStatusValue(newStatus);
    onStatusChange?.(newStatus);
  }

  const handleProgressChange = (newProgress: number) => {
    setProgressValue(newProgress);
    onProgressChange?.(newProgress);
  }

  // Sync component state with props when they change
  useEffect(() => {
    setStatusValue(status || 'plan_to_watch');
    setProgressValue(progress);
  }, [status, progress])

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
        className={`group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-out card-hover border backdrop-blur-sm ${
          variant === 'watchlist' ? 'cursor-pointer' : ''
        } ${
          isDarkMode
            ? 'bg-slate-800/80 border-slate-700/40'
            : 'bg-white/80 border-gray-200/40'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={variant === 'watchlist' ? () => {
          if (isFavoritesTab) {
            setShowRemoveModal(true);
          } else {
            setShowEpisodeModal(true);
          }
        } : undefined}
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
          {/* Browse mode - Show favorite and watchlist buttons */}
          {variant === 'browse' && (
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="flex items-center space-x-3">
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavoriteToggle?.();
                  }}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 hover:bg-white/30 hover:scale-110 transition-all duration-300 group/btn"
                >
                  {isFavorite ? (
                    <HeartSolid className="w-5 h-5 text-red-500 group-hover/btn:scale-110 transition-transform duration-300" />
                  ) : (
                    <HeartOutline className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform duration-300" />
                  )}
                </button>
                
                {/* Watchlist Button */}
                {onWatchlistToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWatchlistToggle();
                    }}
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
          )}
          

        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <h3 className={`font-bold line-clamp-2 text-sm leading-tight transition-colors duration-300 ${
            isDarkMode 
              ? 'text-gray-100' 
              : 'text-gray-900'
          }`}>
            {anime.title}
          </h3>
          
          <div className="flex items-center justify-between text-xs">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {anime.year}
            </p>
          </div>

          {/* Minimal Watchlist Info */}
          {variant === 'watchlist' && (
            <div className="pt-2 border-t border-gray-200/50">
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  statusValue === 'completed' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : statusValue === 'watching'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : statusValue === 'on_hold'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : statusValue === 'dropped'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {statusValue === 'plan_to_watch' ? 'Plan to Watch' :
                   statusValue === 'watching' ? 'Watching' :
                   statusValue === 'completed' ? 'Completed' :
                   statusValue === 'on_hold' ? 'On Hold' :
                   statusValue === 'dropped' ? 'Dropped' : statusValue}
                </span>
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {progressValue}/{anime.episodes || '?'}
                </span>
              </div>
              
              {/* Simple Progress Bar */}
              {progressValue > 0 && (
                <div className={`w-full rounded-full h-1.5 mt-2 overflow-hidden ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Episode Management Modal */}
      {variant === 'watchlist' && showEpisodeModal && !isFavoritesTab && (
        <EpisodeManagementModal
          anime={anime}
          status={statusValue}
          progress={progressValue}
          isOpen={showEpisodeModal}
          onClose={() => setShowEpisodeModal(false)}
          onStatusChange={handleStatusChange}
          onProgressChange={handleProgressChange}
          onFavoriteToggle={onFavoriteToggle}
          onRemove={onRemove}
          isFavorite={isFavorite}
        />
      )}

      {/* Remove from Favorites Modal */}
      {variant === 'watchlist' && isFavoritesTab && showRemoveModal && (
        <RemoveFavoriteModal
          anime={anime}
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          onConfirm={() => {
            onFavoriteToggle?.();
            setShowRemoveModal(false);
          }}
        />
      )}
    </>
  )
} 