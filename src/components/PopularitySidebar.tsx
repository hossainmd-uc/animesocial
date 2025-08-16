'use client'

import { useState, useEffect } from 'react';
import { useDarkMode } from '@/src/hooks/useDarkMode';

interface PopularAnime {
  id: string;
  title: string;
  imageUrl: string;
  score?: number;
  membersCount?: number;
  rank?: number;
}

interface PopularitySidebarProps {
  isHorizontal?: boolean;
}

export default function PopularitySidebar({ isHorizontal = false }: PopularitySidebarProps) {
  const { isDarkMode } = useDarkMode();
  const [popularAnime, setPopularAnime] = useState<PopularAnime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularAnime();
  }, []);

  const fetchPopularAnime = async () => {
    try {
      const response = await fetch('/api/anime/popular?limit=10');
      if (response.ok) {
        const data = await response.json();
        setPopularAnime(data);
      }
    } catch (error) {
      console.error('Error fetching popular anime:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMemberCount = (count?: number) => {
    if (!count) return '';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}k`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className={`p-4 rounded-2xl backdrop-blur-xl transition-all duration-300 container-integrated ${
        isDarkMode 
          ? 'bg-gray-800/40 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] shadow-gray-900/20' 
          : 'bg-white border border-gray-200 shadow-lg'
      } ${isHorizontal ? 'w-full' : 'sticky top-6 w-80'}`}>
        <div className="animate-pulse">
          <div className={`h-6 rounded-lg mb-4 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          <div className={`${isHorizontal ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6' : 'space-y-3'}`}>
            {[...Array(isHorizontal ? 10 : 5)].map((_, i) => (
              <div key={i} className={`${isHorizontal ? 'flex flex-col items-center space-y-3 p-4' : 'flex items-center space-x-3 mb-3'}`}>
                <div className={`w-8 h-8 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} ${isHorizontal ? 'absolute -top-2 -right-2' : ''}`}></div>
                <div className={`${isHorizontal ? 'w-24 h-32' : 'w-12 h-12'} rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <div className={`${isHorizontal ? 'w-full' : 'flex-1'}`}>
                  <div className={`h-4 rounded mb-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                  <div className={`h-3 rounded ${isHorizontal ? 'w-full' : 'w-16'} ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg backdrop-blur-xl transition-all duration-300 hover:bg-opacity-60 container-integrated ${
      isDarkMode 
        ? 'bg-gray-800/40 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] shadow-gray-900/20 hover:shadow-gray-900/30' 
        : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
    } overflow-hidden ${isHorizontal ? 'w-full' : 'w-80'}`}>
      
      {/* Minimal Header */}
      <div className={`relative p-4 ${isHorizontal ? '' : 'border-b'} ${
        isDarkMode ? 'border-slate-700/50' : 'border-slate-200/50'
      }`}>
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>
        
        <div>
          <h3 className={`text-base font-semibold ${
            isDarkMode ? 'text-slate-200' : 'text-slate-800'
          }`}>
            Top Popular Anime
          </h3>
          {!isHorizontal && (
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Most popular series
            </p>
          )}
        </div>
      </div>

      {/* Anime List */}
      <div className={`${isHorizontal ? 'p-4 pt-0' : 'p-4 pt-0'}`}>
        <div className={`${isHorizontal ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6' : 'space-y-3'}`}>
        {popularAnime.map((anime, index) => (
          <div
            key={anime.id}
            className={`group relative ${isHorizontal ? 'flex flex-col items-center text-center' : 'flex items-center'} ${isHorizontal ? 'space-y-3' : 'space-x-3'} ${isHorizontal ? 'p-4' : 'p-2'} rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isDarkMode 
                ? 'hover:bg-slate-800/50' 
                : 'hover:bg-white/60'
            }`}
          >
            {/* Rank Number */}
            <div className={`flex-shrink-0 ${isHorizontal ? 'w-8 h-8 text-sm' : 'w-8 h-8 text-sm'} rounded-full flex items-center justify-center font-bold ${
              index === 0 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                : index === 1
                  ? 'bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-md'
                  : index === 2
                    ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md'
                    : isDarkMode
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-slate-200 text-slate-700'
            } ${isHorizontal ? 'absolute -top-2 -right-2 z-10 ring-2 ring-white/20' : ''}`}>
              {index + 1}
            </div>

            {/* Anime Image */}
            <div className={`flex-shrink-0 ${isHorizontal ? 'w-24 h-32' : 'w-12 h-12'} rounded-lg overflow-hidden shadow-md ${isHorizontal ? 'relative' : ''}`}>
              <img
                src={anime.imageUrl}
                alt={anime.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            {/* Anime Info */}
            <div className={`${isHorizontal ? 'w-full' : 'flex-1'} min-w-0`}>
              <h4 className={`${isHorizontal ? 'text-sm' : 'text-sm'} font-semibold truncate ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {anime.title}
              </h4>
              <div className={`${isHorizontal ? 'flex flex-col space-y-1' : 'flex items-center space-x-2'} text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {anime.score && (
                  <span className="flex items-center space-x-1">
                    <span>⭐</span>
                    <span>{anime.score.toFixed(1)}</span>
                  </span>
                )}
                {anime.membersCount && (
                  <span className="flex items-center space-x-1">
                    <span>👥</span>
                    <span>{formatMemberCount(anime.membersCount)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Hover gradient effect */}
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
              index < 3 
                ? 'bg-gradient-to-r from-transparent via-purple-500/5 to-transparent'
                : 'bg-gradient-to-r from-transparent via-slate-500/5 to-transparent'
            }`}></div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
