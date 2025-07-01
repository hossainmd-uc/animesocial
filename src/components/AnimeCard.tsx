import React, { useState } from 'react';
import Image from 'next/image';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

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
}

const statusOptions = [
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
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
}: AnimeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Math.min(Math.max(0, parseInt(e.target.value) || 0), anime.episodes);
    setLocalProgress(newProgress);
  };

  const handleProgressBlur = async () => {
    if (localProgress !== progress) {
      await onProgressChange(localProgress);
    }
    setIsEditing(false);
  };

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
      {/* Favorite Button */}
      <button
        onClick={onFavoriteToggle}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 hover:bg-white"
      >
        {isFavorite ? (
          <StarSolid className="h-6 w-6 text-yellow-400" />
        ) : (
          <StarOutline className="h-6 w-6 text-gray-400 hover:text-yellow-400" />
        )}
      </button>

      {/* Anime Image */}
      <div className="relative aspect-[3/4]">
        <Image
          src={anime.imageUrl}
          alt={anime.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
          {anime.title}
        </h3>

        {/* Status Select */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full mb-2 p-1 text-sm border rounded"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Progress */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Progress:</span>
          {isEditing ? (
            <input
              type="number"
              value={localProgress}
              onChange={handleProgressChange}
              onBlur={handleProgressBlur}
              min={0}
              max={anime.episodes}
              className="w-16 p-1 border rounded"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="hover:text-blue-500"
            >
              {progress} / {anime.episodes || '?'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 