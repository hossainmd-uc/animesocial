'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Anime {
  id: string;
  title: string;
  imageUrl: string;
  episodes?: number;
  year?: number;
}

interface UserAnime {
  id: string;
  status: string;
  progress: number;
  isFavorite: boolean;
  anime: Anime;
}

export default function FavoritesSection() {
  const [favorites, setFavorites] = useState<UserAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchFavorites();
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/user/anime-list');
      if (response.ok) {
        const data = await response.json();
        const favoriteAnimes = data.filter((item: UserAnime) => item.isFavorite);
        
        // Sort by status priority: Watching → Completed → Dropped → Plan to Watch
        const statusPriority = {
          'watching': 1,
          'completed': 2,
          'dropped': 3,
          'plan_to_watch': 4
        };

        favoriteAnimes.sort((a: UserAnime, b: UserAnime) => {
          const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 5;
          const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 5;
          
          // First sort by status priority
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // If same status, sort alphabetically by title
          return a.anime.title.localeCompare(b.anime.title);
        });
        
        setFavorites(favoriteAnimes);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'watching': { 
        label: 'Watching', 
        bgColor: 'bg-gradient-to-r from-blue-500/80 to-blue-600/80', 
        textColor: 'text-white',
        borderColor: 'border-blue-400/30'
      },
      'completed': { 
        label: 'Completed', 
        bgColor: 'bg-gradient-to-r from-green-500/80 to-green-600/80', 
        textColor: 'text-white',
        borderColor: 'border-green-400/30'
      },
      'dropped': { 
        label: 'Dropped', 
        bgColor: 'bg-gradient-to-r from-red-500/80 to-red-600/80', 
        textColor: 'text-white',
        borderColor: 'border-red-400/30'
      },
      'plan_to_watch': { 
        label: 'Plan to Watch', 
        bgColor: 'bg-gradient-to-r from-gray-500/80 to-gray-600/80', 
        textColor: 'text-white',
        borderColor: 'border-gray-400/30'
      },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['plan_to_watch'];
  };

  const getProgressBarColor = (status: string) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'watching') return 'bg-blue-500';
    if (status === 'dropped') return 'bg-red-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 h-96 flex flex-col border border-white/20 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Favorites</h2>
        </div>
        <div className="space-y-4 flex-1">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-gray-100/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl h-20 flex items-center px-4 animate-pulse border border-gray-200/30 dark:border-gray-600/30">
              <div className="w-14 h-14 bg-gray-200/70 dark:bg-gray-600/70 rounded-lg mr-4"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200/70 dark:bg-gray-600/70 rounded mb-2 w-3/4"></div>
                <div className="h-2 bg-gray-200/70 dark:bg-gray-600/70 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 h-96 flex flex-col border border-white/20 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Favorites</h2>
        </div>
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <StarOutlineIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to see your favorites</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 h-96 flex flex-col border border-white/20 dark:border-gray-700/30">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Favorites ({favorites.length})
        </h2>
        <Link 
          href="/watchlist?tab=favorites"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
        >
          View All
        </Link>
      </div>
      
      {favorites.length > 0 ? (
        <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/50 dark:scrollbar-thumb-gray-600/50 scrollbar-track-transparent">
          {favorites.slice(0, 10).map((item) => (
            <div 
              key={item.id} 
              className="bg-gradient-to-r from-gray-50/70 to-gray-100/70 dark:from-gray-700/70 dark:to-gray-600/70 backdrop-blur-sm rounded-xl p-3 flex items-center hover:from-gray-100/80 hover:to-gray-200/80 dark:hover:from-gray-600/80 dark:hover:to-gray-500/80 transition-all duration-300 group border border-gray-200/30 dark:border-gray-600/30"
            >
              {/* Anime Image */}
              <div className="w-12 h-16 bg-gray-200/50 dark:bg-gray-600/50 rounded-lg mr-4 overflow-hidden flex-shrink-0 border border-gray-300/30 dark:border-gray-500/30">
                {item.anime.imageUrl ? (
                  <img
                    src={item.anime.imageUrl}
                    alt={item.anime.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    📺
                  </div>
                )}
              </div>
              
              {/* Anime Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                    {item.anime.title}
                  </h3>
                  {/* Status Badge */}
                  <span className={`${getStatusBadge(item.status).bgColor} ${getStatusBadge(item.status).textColor} ${getStatusBadge(item.status).borderColor} text-xs font-medium px-3 py-1 rounded-full ml-2 flex-shrink-0 backdrop-blur-sm border shadow-sm`}>
                    {getStatusBadge(item.status).label}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  {item.anime.year && (
                    <span className="mr-2">{item.anime.year}</span>
                  )}
                  {item.anime.episodes && (
                    <span>{item.anime.episodes} episodes</span>
                  )}
                </div>
                {item.progress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200/60 dark:bg-gray-600/60 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`${getProgressBarColor(item.status)} h-1.5 rounded-full transition-all shadow-sm`}
                        style={{ 
                          width: `${Math.min((item.progress / (item.anime.episodes || 12)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.progress}/{item.anime.episodes || '?'} episodes
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {favorites.length > 10 && (
            <div className="text-center pt-4">
              <Link 
                href="/watchlist?tab=favorites"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
              >
                +{favorites.length - 10} more favorites
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <StarOutlineIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No favorites yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Star anime on the search page to add them here
          </p>
          <Link 
            href="/animes"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Discover Anime
          </Link>
        </div>
      )}
    </div>
  );
} 