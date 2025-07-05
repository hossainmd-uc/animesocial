import React, { useState } from 'react';
import Image from 'next/image';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid, PencilIcon } from '@heroicons/react/24/solid';
import ProgressEditModal from './ProgressEditModal';

interface Anime {
  id: string;
  title: string;
  imageUrl: string;
  episodes: number;
}

interface AnimeCardProps {
  anime: Anime;
  status: string;
  progress: number;
  isFavorite: boolean;
  onStatusChange: (newStatus: string) => Promise<void>;
  onProgressChange: (newProgress: number) => Promise<void>;
  onFavoriteToggle: () => Promise<void>;
  onRemove?: () => Promise<void>;
}

const statusOptions = [
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'plan_to_watch', label: 'Plan to Watch' },
];

export default function AnimeCard({
  anime,
  status,
  progress,
  isFavorite,
  onStatusChange,
  onProgressChange,
  onFavoriteToggle,
  onRemove,
}: AnimeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const progressPercentage = anime.episodes ? (progress / anime.episodes) * 100 : 0;

  const getProgressBarColor = () => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'watching') return 'bg-blue-500';
    if (status === 'dropped') return 'bg-red-500';
    return 'bg-gray-400';
  };

  const handleProgressSave = async (newProgress: number) => {
    await onProgressChange(newProgress);
  };

  return (
    <>
      <div className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
        {/* Favorite Button */}
        <button
          onClick={onFavoriteToggle}
          className="absolute top-2 right-12 z-10 p-2 rounded-lg bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {isFavorite ? (
            <StarSolid className="h-5 w-5 text-yellow-400 drop-shadow-sm" />
          ) : (
            <StarOutline className="h-5 w-5 text-gray-400 hover:text-yellow-400 transition-colors duration-200" />
          )}
        </button>

        {/* Remove Button - always visible when onRemove is provided */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            title="Remove from watchlist"
          >
            <svg className="w-5 h-5 text-red-500 hover:text-red-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Anime Image */}
        <div className="relative aspect-[3/4]">
          <Image
            src={anime.imageUrl}
            alt={anime.title}
            fill
            className="object-cover"
          />
          
          {/* Progress overlay for visual progress indication */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm">
              <div className="px-2 py-1">
                <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full ${getProgressBarColor()} transition-all duration-300 ease-out`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="text-white text-xs mt-1 text-center">
                  {progress}/{anime.episodes || '?'} episodes
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3 line-clamp-2">
            {anime.title}
          </h3>

          {/* Status Select */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full mb-3 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Progress Section */}
          <div className="space-y-2">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full ${getProgressBarColor()} transition-all duration-300 ease-out`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            
            {/* Progress Info and Edit Button */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {progress} / {anime.episodes || '?'} episodes
              </span>
              {status !== 'plan_to_watch' ? (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-sm transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <PencilIcon className="h-3 w-3" />
                  Edit
                </button>
              ) : (
                <span className="text-xs text-gray-400 px-3 py-1.5">
                  Start watching to track progress
                </span>
              )}
            </div>

            {/* Progress Percentage */}
            <div className="text-xs text-gray-500 text-center">
              {Math.round(progressPercentage)}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Progress Edit Modal */}
      <ProgressEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        anime={anime}
        currentProgress={progress}
        onSave={handleProgressSave}
      />
    </>
  );
} 