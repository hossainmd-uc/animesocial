'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Header from '@/src/components/layout/Header';
import { createClient } from '@/src/lib/supabase/client';

interface Anime {
  id: string;
  malId: number;
  title: string;
  titleEnglish?: string;
  synopsis?: string;
  episodes?: number;
  score?: number;
  year?: number;
  status: string;
  imageUrl?: string;
  type?: string;
  rating?: string;
}

interface UserAnime {
  id: string;
  status: string;
  progress: number;
  isFavorite: boolean;
  anime: Anime;
}

const statusFilters = [
  { value: 'all', label: 'All Status' },
  { value: 'Finished Airing', label: 'Finished Airing' },
  { value: 'Currently Airing', label: 'Currently Airing' },
  { value: 'Not yet aired', label: 'Not Yet Aired' },
];

const typeFilters = [
  { value: 'all', label: 'All Types' },
  { value: 'TV', label: 'TV Series' },
  { value: 'Movie', label: 'Movies' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'Special', label: 'Specials' },
];

export default function AnimesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [userAnimeList, setUserAnimeList] = useState<UserAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    fetchAnimes();
    if (user) {
      fetchUserAnimeList();
    }
  }, [user]);

  const fetchAnimes = async () => {
    try {
      const response = await fetch('/api/animes');
      if (response.ok) {
        const data = await response.json();
        setAnimes(data);
      }
    } catch (error) {
      console.error('Error fetching animes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnimeList = async () => {
    try {
      const response = await fetch('/api/user/anime-list');
      if (response.ok) {
        const data = await response.json();
        setUserAnimeList(data);
      }
    } catch (error) {
      console.error('Error fetching user anime list:', error);
    }
  };

  const addToWatchlist = async (animeId: string) => {
    if (!user) return;

    const existingEntry = userAnimeList.find(item => item.anime.id === animeId);
    
    if (existingEntry) {
      // Entry already exists, don't do anything (it's already in watchlist)
      console.log('Anime already in watchlist');
      return;
    }

    try {
      // Create new entry with just watchlist status (not favorite)
      const response = await fetch('/api/user/anime-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeId, isFavorite: false }),
      });

      if (response.ok) {
        await fetchUserAnimeList();
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const isInWatchlist = (animeId: string) => {
    return userAnimeList.some(item => item.anime.id === animeId);
  };

  const isFavorite = (animeId: string) => {
    return userAnimeList.some(item => item.anime.id === animeId && item.isFavorite);
  };

  const toggleFavorite = async (animeId: string) => {
    console.log('🌟 toggleFavorite called with animeId:', animeId);
    console.log('👤 user:', user);
    console.log('📊 userAnimeList:', userAnimeList);
    
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    const existingEntry = userAnimeList.find(item => item.anime.id === animeId);
    console.log('📝 existingEntry:', existingEntry);
    
    if (existingEntry) {
      // Update existing entry
      console.log('🔄 Updating existing entry...');
      try {
        const requestBody = { 
          id: existingEntry.id, 
          isFavorite: !existingEntry.isFavorite 
        };
        console.log('📤 PATCH request body:', requestBody);
        
        const response = await fetch('/api/user/anime-list', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        console.log('📨 PATCH response status:', response.status);
        const responseData = await response.json();
        console.log('📨 PATCH response data:', responseData);

        if (response.ok) {
          console.log('✅ PATCH successful, refreshing list...');
          await fetchUserAnimeList();
        } else {
          console.error('❌ PATCH failed:', responseData);
        }
      } catch (error) {
        console.error('❌ Error toggling favorite:', error);
      }
    } else {
      // Create new entry as favorite
      console.log('➕ Creating new entry as favorite...');
      try {
        const requestBody = { animeId, isFavorite: true };
        console.log('📤 POST request body:', requestBody);
        
        const response = await fetch('/api/user/anime-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        console.log('📨 POST response status:', response.status);
        const responseData = await response.json();
        console.log('📨 POST response data:', responseData);

        if (response.ok) {
          console.log('✅ POST successful, refreshing list...');
          await fetchUserAnimeList();
        } else {
          console.error('❌ POST failed:', responseData);
        }
      } catch (error) {
        console.error('❌ Error adding to favorites:', error);
      }
    }
  };

  const filteredAnimes = animes.filter(anime => {
    const matchesSearch = anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (anime.titleEnglish?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || anime.status === statusFilter;
    const matchesType = typeFilter === 'all' || anime.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anime Search</h1>
          <p className="text-gray-600">Discover and browse through our anime database</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search anime titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
              >
                {statusFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
              >
                {typeFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredAnimes.length} of {animes.length} anime
          </p>
        </div>

        {/* Anime Grid */}
        {filteredAnimes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredAnimes.map((anime) => (
              <div key={anime.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                {/* Anime Image */}
                <div className="relative aspect-[3/4] bg-gray-200">
                  {anime.imageUrl ? (
                    <img
                      src={anime.imageUrl}
                      alt={anime.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">📺</span>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {user && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {/* Add to Favorites Button */}
                      <button
                        onClick={() => toggleFavorite(anime.id)}
                        className={`p-2 rounded-lg ${
                          isFavorite(anime.id)
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white/90 hover:bg-white text-gray-700'
                        } shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm cursor-pointer`}
                        title={isFavorite(anime.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        ⭐
                      </button>
                      
                      {/* Add to Watchlist Button */}
                      <button
                        onClick={() => addToWatchlist(anime.id)}
                        disabled={isInWatchlist(anime.id)}
                        className={`p-2 rounded-lg ${
                          isInWatchlist(anime.id)
                            ? 'bg-green-500 text-white'
                            : 'bg-white/90 hover:bg-white text-gray-700'
                        } shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm disabled:transform-none cursor-pointer disabled:cursor-default`}
                        title={isInWatchlist(anime.id) ? 'Already in watchlist' : 'Add to watchlist'}
                      >
                        {isInWatchlist(anime.id) ? '✓' : '+'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Anime Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {anime.title}
                  </h3>
                  
                  {anime.titleEnglish && anime.titleEnglish !== anime.title && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                      {anime.titleEnglish}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                    {anime.year && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {anime.year}
                      </span>
                    )}
                    {anime.type && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {anime.type}
                      </span>
                    )}
                    {anime.episodes && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                        {anime.episodes} eps
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${
                      anime.status === 'Finished Airing' 
                        ? 'bg-gray-100 text-gray-700'
                        : anime.status === 'Currently Airing'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {anime.status}
                    </span>
                    
                    {anime.score && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium text-gray-700">
                          {anime.score}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No anime found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 