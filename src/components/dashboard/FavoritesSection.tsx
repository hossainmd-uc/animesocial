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
        setFavorites(favoriteAnimes);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };



  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 h-96 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Favorites</h2>
        </div>
        <div className="space-y-4 flex-1">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-gray-100 rounded-lg h-20 flex items-center px-4 animate-pulse">
              <div className="w-14 h-14 bg-gray-200 rounded-lg mr-4"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 h-96 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Favorites</h2>
        </div>
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <StarOutlineIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Sign in to see your favorites</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-96 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Favorites ({favorites.length})
        </h2>
        <Link 
          href="/watchlist?tab=favorites"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All
        </Link>
      </div>
      
      {favorites.length > 0 ? (
        <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {favorites.slice(0, 10).map((item) => (
            <div 
              key={item.id} 
              className="bg-gray-50 rounded-lg p-3 flex items-center hover:bg-gray-100 transition-colors group"
            >
              {/* Anime Image */}
              <div className="w-12 h-16 bg-gray-200 rounded-lg mr-4 overflow-hidden flex-shrink-0">
                {item.anime.imageUrl ? (
                  <img
                    src={item.anime.imageUrl}
                    alt={item.anime.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    📺
                  </div>
                )}
              </div>
              
              {/* Anime Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {item.anime.title}
                </h3>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  {item.anime.year && (
                    <span className="mr-2">{item.anime.year}</span>
                  )}
                  {item.anime.episodes && (
                    <span>{item.anime.episodes} episodes</span>
                  )}
                </div>
                {item.progress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((item.progress / (item.anime.episodes || 12)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
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
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                +{favorites.length - 10} more favorites
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 flex-1 flex flex-col justify-center">
          <StarOutlineIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No favorites yet</h3>
          <p className="text-gray-500 text-sm mb-4">
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