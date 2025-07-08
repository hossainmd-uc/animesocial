import React, { useState } from 'react';
import Image from 'next/image';
import { HeartIcon as HeartOutline, PlusIcon, XMarkIcon, BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, PencilIcon, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/solid';
import ProgressEditModal from './ProgressEditModal';
import AnimeDetailsModal from './AnimeDetailsModal';

interface Anime {
  id: string;
  title: string;
  imageUrl: string;
  episodes: number;
  score?: number;
  year?: number;
  synopsis?: string;
  genres?: string[];
  status?: string;
  type?: string;
  duration?: string;
}

interface EnhancedAnimeCardProps {
  anime: Anime;
  status?: string;
  progress?: number;
  isFavorite?: boolean;
  isInWatchlist?: boolean;
  onStatusChange?: (newStatus: string) => Promise<void>;
  onProgressChange?: (newProgress: number) => Promise<void>;
  onFavoriteToggle?: () => Promise<void>;
  onWatchlistToggle?: () => Promise<void>;
  onRemove?: () => Promise<void>;
  variant?: 'watchlist' | 'browse';
}

const statusOptions = [
  { value: 'watching', label: 'Watching', color: 'text-blue-500' },
  { value: 'completed', label: 'Completed', color: 'text-green-500' },
  { value: 'dropped', label: 'Dropped', color: 'text-red-500' },
  { value: 'plan_to_watch', label: 'Plan to Watch', color: 'text-gray-500' },
];

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const progressPercentage = anime.episodes ? (progress / anime.episodes) * 100 : 0;

  const getProgressBarColor = () => {
    if (status === 'completed') return 'bg-gradient-to-r from-green-500 to-emerald-600';
    if (status === 'watching') return 'bg-gradient-to-r from-blue-500 to-cyan-600';
    if (status === 'dropped') return 'bg-gradient-to-r from-red-500 to-rose-600';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const handleProgressSave = async (newProgress: number) => {
    if (onProgressChange) {
      await onProgressChange(newProgress);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent modal from opening if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Show details modal for browse mode
    if (variant === 'browse' && anime.synopsis) {
      setShowDetailsModal(true);
    }
  };

  return (
    <>
      <div 
        className="group relative bg-white/80 dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-out card-hover border border-gray-200/40 dark:border-slate-700/40 cursor-pointer backdrop-blur-sm"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
      >
        {/* Main Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={anime.imageUrl}
            alt={anime.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Progress Overlay */}
          {variant === 'watchlist' && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm">
              <div className="px-3 py-2">
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mb-1">
                  <div 
                    className={`h-full ${getProgressBarColor()} transition-all duration-500 ease-out shadow-lg`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="text-white text-xs font-medium text-center">
                  {progress}/{anime.episodes || '?'} episodes
                </div>
              </div>
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
                  className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 hover:bg-white/30 hover:scale-110 transition-all duration-300 group/btn"
                >
                  {isInWatchlist ? (
                    <BookmarkSolid className="w-5 h-5 text-blue-400 group-hover/btn:scale-110 transition-transform duration-300" />
                  ) : (
                    <BookmarkOutline className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform duration-300" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Score Badge */}
          {anime.score && (
            <div className="absolute top-3 left-3 glass-effect bg-black/30 backdrop-blur-md px-2 py-1 rounded-lg">
              <div className="flex items-center space-x-1">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-white text-sm font-medium">{anime.score}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 text-sm leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              {anime.title}
            </h3>
            
            {anime.year && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {anime.year} • {anime.episodes || '?'} episodes
              </p>
            )}
          </div>

          {/* Watchlist Specific Controls */}
          {variant === 'watchlist' && onStatusChange && (
            <div className="space-y-3">
              {/* Status Select */}
              <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Progress Section */}
              {status !== 'plan_to_watch' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Progress: {Math.round(progressPercentage)}%
                    </span>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all duration-300 btn-animate"
                    >
                      <PencilIcon className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${getProgressBarColor()} transition-all duration-500 ease-out`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Progress Edit Modal */}
      {variant === 'watchlist' && (
        <ProgressEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          anime={anime}
          currentProgress={progress}
          onSave={handleProgressSave}
        />
      )}

      {/* Anime Details Modal */}
      <AnimeDetailsModal
        anime={anime}
        isVisible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        mousePosition={{ x: 0, y: 0 }}
      />
    </>
  );
} 