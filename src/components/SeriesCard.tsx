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

interface SeriesCardProps {
  series: {
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
  };
  onOpenDetails?: (seriesId: string) => void;
}

export default function SeriesCard({ series, onOpenDetails }: SeriesCardProps) {
  const { isDarkMode } = useDarkMode();
  const [isExpanded, setIsExpanded] = useState(false);

  const mainAnime = series.animes.find(a => a.seriesType === 'main') || series.animes[0];
  const hasMultipleEntries = series.animeCount > 1;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TV': return '📺';
      case 'Movie': return '🎬';
      case 'OVA': return '💿';
      case 'Special': return '⭐';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'ongoing': return 'text-blue-500';
      case 'upcoming': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-300 gamer-card-hover scan-lines backdrop-blur-xl ${
      isDarkMode ? 'bg-gray-800/90 border border-gray-700/30' : 'bg-white/90 border border-gray-200/30'
    }`}>
      {/* Main Image and Info */}
      <div className="relative">
        <img
          src={series.imageUrl || mainAnime?.imageUrl || '/placeholder-anime.jpg'}
          alt={series.title}
          className="w-full h-64 object-cover"
        />
        
        {/* Score Badge */}
        {series.averageScore && (
          <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded-lg text-sm font-bold flex items-center">
            ⭐ {series.averageScore.toFixed(1)}
          </div>
        )}

        {/* Multiple Entries Badge */}
        {hasMultipleEntries && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-lg text-sm font-bold">
            {series.animeCount} entries
          </div>
        )}

        {/* Status */}
        <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-semibold capitalize ${
          isDarkMode ? 'bg-slate-700/90' : 'bg-white/90'
        } ${getStatusColor(series.status)}`}>
          {series.status}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className={`font-bold text-lg mb-2 line-clamp-2 ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {series.title}
        </h3>

        {series.titleEnglish && series.titleEnglish !== series.title && (
          <p className={`text-sm mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {series.titleEnglish}
          </p>
        )}

        {/* Series Stats */}
        <div className={`flex flex-wrap gap-2 mb-3 text-sm ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {series.totalEpisodes && (
            <span className="flex items-center">
              📺 {series.totalEpisodes} eps
            </span>
          )}
          {series.startYear && (
            <span className="flex items-center">
              📅 {series.startYear}{series.endYear && series.endYear !== series.startYear ? `-${series.endYear}` : ''}
            </span>
          )}
        </div>

        {/* Description */}
        {series.description && (
          <p className={`text-sm mb-3 line-clamp-3 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {series.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onOpenDetails?.(series.id)} 
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              isDarkMode 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            View Details
          </button>
          
          {/* Heart (Add to Favorites) Icon */}
          <button 
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? 'bg-slate-700 hover:bg-red-600 text-gray-300 hover:text-white' 
                : 'bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white'
            }`}
            title="Add to Favorites"
          >
            ❤️
          </button>
          
          {/* Plus (Add to List) Icon */}
          <button 
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? 'bg-slate-700 hover:bg-green-600 text-gray-300 hover:text-white' 
                : 'bg-gray-100 hover:bg-green-600 text-gray-600 hover:text-white'
            }`}
            title="Add to List"
          >
            ➕
          </button>

          {hasMultipleEntries && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>

        {/* Expanded Anime List */}
        {isExpanded && hasMultipleEntries && (
          <div className={`mt-4 pt-4 border-t ${
            isDarkMode ? 'border-slate-600' : 'border-gray-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              All Entries:
            </h4>
            <div className="space-y-2">
              {series.animes
                .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0))
                .map((anime) => (
                  <div key={anime.id} className={`flex items-center justify-between p-2 rounded ${
                    isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
                  }`}>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {anime.title}
                      </p>
                      <div className={`flex items-center gap-2 text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
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