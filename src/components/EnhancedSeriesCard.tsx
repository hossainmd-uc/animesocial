'use client'

import { useState } from 'react';
import { useDarkMode } from '@/src/hooks/useDarkMode';

interface AnimeEntry {
  id: string;
  title: string;
  titleEnglish?: string;
  episodes?: number;
  score?: number;
  year?: number;
  type: string;
  seriesType?: string;
  seriesOrder?: number;
  imageUrl: string;
  status: string;
  synopsis?: string;
}

interface Series {
  id: string;
  title: string;
  titleEnglish?: string;
  description?: string;
  imageUrl?: string;
  status: string;
  startYear?: number;
  endYear?: number;
  totalEpisodes?: number;
  averageScore?: number;
  animeCount: number;
  animes: AnimeEntry[];
}

interface EnhancedSeriesCardProps {
  series: Series;
  onOpenDetails?: (seriesId: string) => void;
  onFavoriteToggle: () => void;
  onWatchlistToggle: () => void;
  isFavorite: boolean;
  isInWatchlist: boolean;
  hideStats?: boolean;
  isMobile?: boolean;
}

export default function EnhancedSeriesCard({ 
  series, 
  onOpenDetails, 
  onFavoriteToggle, 
  onWatchlistToggle, 
  isFavorite, 
  isInWatchlist,
  hideStats = false,
  isMobile = false
}: EnhancedSeriesCardProps) {
  const { isDarkMode } = useDarkMode();
  const [isExpanded, setIsExpanded] = useState(false);

  const mainAnime = series.animes.find(a => a.seriesType === 'main') || series.animes[0];
  const hasMultipleEntries = series.animeCount > 1;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TV': return '📺';
      case 'Movie': return '🎬';
      case 'OVA': return '💿';
      case 'Special': return '✨';
      case 'Music': return '🎵';
      default: return '📺';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ongoing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'upcoming': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Don't trigger card click if there was significant drag movement
    const scrollContainer = (e.target as HTMLElement).closest('[data-drag-distance]');
    const dragDistance = scrollContainer?.getAttribute('data-drag-distance');
    if (dragDistance && parseFloat(dragDistance) > 10) {
      return;
    }
    
    onOpenDetails?.(series.id);
  };

  return (
    <div 
      className={`h-full flex flex-col rounded-lg overflow-hidden shadow-lg card-clickable ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}
      onClick={handleCardClick}
    >
      {/* Main Image and Info */}
      <div className="relative flex-shrink-0">
        <img 
          src={series.imageUrl || mainAnime?.imageUrl || '/placeholder-anime.jpg'} 
          alt={series.titleEnglish || series.title}
          className="w-full h-64 object-cover"
        />
        {series.averageScore && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm font-medium">
            ⭐ {series.averageScore.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title Section - Fixed height */}
        <div className="mb-3">
          <h3 className={`font-bold mb-2 line-clamp-2 min-h-[3.5rem] ${
            isMobile ? 'text-sm' : 'text-lg'
          } ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {series.titleEnglish || series.title}
          </h3>
        </div>

        {/* Series Stats */}
        {!hideStats && (
          <div className={`flex flex-wrap gap-3 mb-4 text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {series.totalEpisodes && (
              <span className="flex items-center gap-1">
                <span className="text-purple-400">📺</span>
                {series.totalEpisodes} episodes
              </span>
            )}
            {series.animeCount > 1 && (
              <span className="flex items-center gap-1">
                <span className="text-blue-400">🎬</span>
                {series.animeCount} seasons
              </span>
            )}
          </div>
        )}

        {/* Flexible spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        {/* Action Buttons - Always at bottom */}
        <div className="flex gap-2 mt-auto">
          {/* Heart (Favorite) Icon */}
          <button 
            onClick={onFavoriteToggle}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isFavorite
                ? 'bg-red-100 hover:bg-red-200 border-2 border-red-500'
                : isDarkMode 
                  ? 'bg-slate-700 hover:bg-red-600 text-gray-300 hover:text-white border-2 border-transparent hover:border-red-500' 
                  : 'bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white border-2 border-transparent hover:border-red-500'
            }`}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            {isFavorite ? (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
          
          {/* Watchlist Icon */}
          <button 
            onClick={onWatchlistToggle}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isInWatchlist
                ? 'bg-green-100 hover:bg-green-200 border-2 border-green-500'
                : isDarkMode 
                  ? 'bg-slate-700 hover:bg-green-600 text-gray-300 hover:text-white border-2 border-transparent hover:border-green-500' 
                  : 'bg-gray-100 hover:bg-green-600 text-gray-600 hover:text-white border-2 border-transparent hover:border-green-500'
            }`}
            title={isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
          >
            {isInWatchlist ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>

          {hasMultipleEntries && !isMobile && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isExpanded ? (
                  // Collapse icon (horizontal bars getting closer)
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 9H4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 15H4" />
                  </>
                ) : (
                  // Expand icon (horizontal bars with spacing)
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 6H4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 18H4" />
                  </>
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Expanded Anime List */}
        {isExpanded && hasMultipleEntries && (
          <div className={`mt-4 pt-4 border-t ${
            isDarkMode ? 'border-slate-600' : 'border-gray-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              All Entries:
            </h4>
            <div className="space-y-2">
              {series.animes.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0)).map((anime) => (
                <div key={anime.id} className={`flex items-center justify-between p-2 rounded ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {anime.title}
                    </p>
                    <div className={`flex items-center gap-2 text-xs ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <span>{getTypeIcon(anime.type)} {anime.type}</span>
                      {anime.episodes && <span>• {anime.episodes} eps</span>}
                      {anime.year && <span>• {anime.year}</span>}
                      {anime.score && <span>• ⭐ {anime.score}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 