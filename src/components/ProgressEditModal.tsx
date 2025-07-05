'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline'

interface Anime {
  id: string;
  title: string;
  imageUrl: string;
  episodes: number;
}

interface ProgressEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: Anime;
  currentProgress: number;
  onSave: (newProgress: number) => Promise<void>;
}

export default function ProgressEditModal({
  isOpen,
  onClose,
  anime,
  currentProgress,
  onSave,
}: ProgressEditModalProps) {
  const [progress, setProgress] = useState(currentProgress);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProgress(currentProgress);
  }, [currentProgress, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(progress);
      onClose();
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const incrementProgress = () => {
    if (progress < anime.episodes) {
      setProgress(progress + 1);
    }
  };

  const decrementProgress = () => {
    if (progress > 0) {
      setProgress(progress - 1);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(parseInt(e.target.value));
  };

  const progressPercentage = anime.episodes ? (progress / anime.episodes) * 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${anime.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
            
            {/* Title */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-white text-xl font-bold leading-tight">
                {anime.title}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Edit Progress
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Progress Display */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {progress} / {anime.episodes || '?'}
            </div>
            <div className="text-sm text-gray-500">Episodes Watched</div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(progressPercentage)}% Complete
              </div>
            </div>
          </div>

          {/* Progress Controls */}
          <div className="space-y-4">
            {/* Increment/Decrement Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={decrementProgress}
                disabled={progress <= 0}
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MinusIcon className="h-6 w-6 text-gray-600" />
              </button>
              
              <div className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
                {progress}
              </div>
              
              <button
                onClick={incrementProgress}
                disabled={progress >= anime.episodes}
                className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PlusIcon className="h-6 w-6 text-blue-600" />
              </button>
            </div>

            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="0"
                max={anime.episodes || 100}
                value={progress}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #e5e7eb ${progressPercentage}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>{anime.episodes || '?'}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setProgress(0)}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setProgress(anime.episodes || 0)}
                className="flex-1 py-2 px-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                Mark Complete
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 