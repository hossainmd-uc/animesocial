import React from 'react';
import Image from 'next/image';
import { StarIcon, CalendarIcon, PlayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useDarkMode } from '@/src/hooks/useDarkMode';

interface Anime {
  id: string;
  title: string;
  imageUrl: string;
  episodes?: number;
  score?: number;
  year?: number;
  synopsis?: string;
  genres?: string[];
  status?: string;
  type?: string;
  duration?: string;
}

interface AnimeDetailsModalProps {
  anime: Anime;
  isOpen: boolean;
  onClose: () => void;
  isFavorite?: boolean;
  isInWatchlist?: boolean;
  onFavoriteToggle?: () => void;
  onWatchlistToggle?: () => void;
}

export default function AnimeDetailsModal({ 
  anime, 
  isOpen, 
  onClose
}: AnimeDetailsModalProps) {
  const { isDarkMode, mounted } = useDarkMode();

  if (!isOpen || !mounted) return null;

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-500 ease-out ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Softer overlay background */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-lg transition-opacity duration-500"
        onClick={onClose}
      />
      
      {/* Main content container */}
      <div className="relative h-full flex items-center justify-center p-4 md:p-8">
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/20'
        } backdrop-blur-xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-full overflow-hidden transform transition-all duration-500 ease-out ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/10 backdrop-blur-sm rounded-full text-white hover:bg-black/20 transition-all duration-300 hover:scale-110 border border-white/10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {/* Content wrapper with scroll */}
          <div className="max-h-[85vh] overflow-y-auto">
            {/* Hero section with background image */}
            <div className="relative h-64 md:h-80 overflow-hidden">
              <Image
                src={anime.imageUrl}
                alt={anime.title}
                fill
                className="object-cover"
                sizes="100vw"
              />
              {/* Softer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              
              {/* Hero content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <div className="flex items-end gap-4">
                  {/* Poster image */}
                  <div className="relative w-24 h-32 md:w-28 md:h-40 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl border-2 border-white/10 backdrop-blur-sm">
                    <Image
                      src={anime.imageUrl}
                      alt={anime.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 96px, 112px"
                    />
                    {anime.score && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg border border-yellow-400/30">
                        <StarIcon className="w-3 h-3" />
                        {anime.score}
                      </div>
                    )}
                  </div>
                  
                  {/* Title and basic info */}
                  <div className="flex-1 space-y-3">
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">
                      {anime.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-2 text-white/90">
                      {anime.year && (
                        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
                          <CalendarIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">{anime.year}</span>
                        </div>
                      )}
                      
                      {anime.episodes && (
                        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
                          <PlayIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">{anime.episodes} episodes</span>
                        </div>
                      )}
                      
                      {anime.type && (
                        <div className="px-2 py-1 bg-blue-500/70 backdrop-blur-sm rounded-full text-xs font-medium border border-blue-400/30">
                          {anime.type}
                        </div>
                      )}
                      
                      {anime.status && (
                        <div className="px-2 py-1 bg-green-500/70 backdrop-blur-sm rounded-full text-xs font-medium capitalize border border-green-400/30">
                          {anime.status.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content sections with glassmorphism */}
            <div className={`p-4 md:p-6 space-y-6 ${
              isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'
            } backdrop-blur-sm`}>
              
              {/* Synopsis section */}
              {anime.synopsis && (
                <div className={`space-y-3 p-4 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700/30' 
                    : 'bg-white/50 border-white/20'
                } backdrop-blur-sm rounded-xl border`}>
                  <h2 className={`text-xl font-bold ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>Synopsis</h2>
                  <p className={`${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  } leading-relaxed text-sm`}>
                    {anime.synopsis}
                  </p>
                </div>
              )}
              
              {/* Genres section */}
              {anime.genres && anime.genres.length > 0 && (
                <div className={`space-y-3 p-4 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700/30' 
                    : 'bg-white/50 border-white/20'
                } backdrop-blur-sm rounded-xl border`}>
                  <h2 className={`text-xl font-bold ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>Genres</h2>
                  <div className="flex flex-wrap gap-2">
                    {anime.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-sm text-white rounded-full text-xs font-medium shadow-lg hover:shadow-xl transition-shadow duration-300 border border-blue-400/30"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`space-y-3 p-4 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700/30' 
                    : 'bg-white/50 border-white/20'
                } backdrop-blur-sm rounded-xl border`}>
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>Details</h3>
                  <div className="space-y-2">
                    {anime.year && (
                      <div className={`flex justify-between items-center py-1 border-b ${
                        isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'
                      }`}>
                        <span className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Year</span>
                        <span className={`font-medium text-sm ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>{anime.year}</span>
                      </div>
                    )}
                    {anime.episodes && (
                      <div className={`flex justify-between items-center py-1 border-b ${
                        isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'
                      }`}>
                        <span className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Episodes</span>
                        <span className={`font-medium text-sm ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>{anime.episodes}</span>
                      </div>
                    )}
                    {anime.type && (
                      <div className={`flex justify-between items-center py-1 border-b ${
                        isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'
                      }`}>
                        <span className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Type</span>
                        <span className={`font-medium text-sm ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>{anime.type}</span>
                      </div>
                    )}
                    {anime.status && (
                      <div className={`flex justify-between items-center py-1 border-b ${
                        isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'
                      }`}>
                        <span className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Status</span>
                        <span className={`font-medium text-sm capitalize ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {anime.status.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {anime.score && (
                      <div className="flex justify-between items-center py-1">
                        <span className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Rating</span>
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-4 h-4 text-yellow-500" />
                          <span className={`font-medium text-sm ${
                            isDarkMode ? 'text-gray-100' : 'text-gray-900'
                          }`}>{anime.score}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions section */}
                <div className={`space-y-3 p-4 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700/30' 
                    : 'bg-white/50 border-white/20'
                } backdrop-blur-sm rounded-xl border`}>
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-blue-500/30 text-sm">
                      Add to Watchlist
                    </button>
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-red-500/90 to-pink-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-red-500/30 text-sm">
                      Add to Favorites
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 