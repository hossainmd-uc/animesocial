'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Header from '@/src/components/layout/Header';
import EnhancedAnimeCard from '@/src/components/EnhancedAnimeCard';
import { createClient } from '@/src/lib/supabase/client';
import { useDarkMode } from '@/src/hooks/useDarkMode';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const { isDarkMode, mounted } = useDarkMode();

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
      console.log('Anime already in watchlist');
      return;
    }

    try {
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

  const toggleFavorite = async (animeId: string) => {
    if (!user) return;

    const existingEntry = userAnimeList.find(item => item.anime.id === animeId);
    
    if (existingEntry) {
      try {
        const response = await fetch('/api/user/anime-list', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existingEntry.id, isFavorite: !existingEntry.isFavorite }),
        });

        if (response.ok) {
          await fetchUserAnimeList();
        }
      } catch (error) {
        console.error('Error updating favorite:', error);
      }
    } else {
      try {
        const response = await fetch('/api/user/anime-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ animeId, isFavorite: true }),
        });

        if (response.ok) {
          await fetchUserAnimeList();
        }
      } catch (error) {
        console.error('Error adding to favorites:', error);
      }
    }
  };

  const isInWatchlist = (animeId: string) => {
    return userAnimeList.some(item => item.anime.id === animeId);
  };

  const isFavorite = (animeId: string) => {
    return userAnimeList.some(item => item.anime.id === animeId && item.isFavorite);
  };

  const filteredAnimes = animes.filter(anime => {
    const matchesSearch = anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (anime.titleEnglish?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || anime.status === statusFilter;
    const matchesType = typeFilter === 'all' || anime.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusChange = async (animeId: string, status: string) => {
    // Implementation would be added here
  };

  const handleProgressChange = async (animeId: string, progress: number) => {
    // Implementation would be added here
  };

  const handleFavoriteToggle = async (animeId: string) => {
    toggleFavorite(animeId);
  };

  const handleWatchlistToggle = async (animeId: string) => {
    addToWatchlist(animeId);
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen smooth-gradient transition-all duration-500">
        <Header />
        <div className="content-wrapper section-padding py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading anime database...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen smooth-gradient transition-all duration-500">
      <Header />
      
      <div className="content-wrapper section-padding py-8">
        {/* Search and Filters */}
        <div className={`backdrop-blur-lg rounded-2xl p-6 mb-8 border ${
          isDarkMode 
            ? 'bg-slate-800/70 shadow-xl border-slate-700/30' 
            : 'bg-card/40 shadow-sm border-border/30'
        }`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1 group">
              <input
                type="text"
                placeholder="Search anime titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl border hover:border-purple-300/40 focus:outline-none focus:ring-0 focus:border-purple-400/60 transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-slate-700/80 border-slate-600/50 hover:border-purple-500/60 focus:border-purple-400/80 text-slate-200 placeholder-slate-400 shadow-none'
                    : 'bg-input/60 border-border/20 hover:border-purple-300/40 focus:border-purple-400/60 text-foreground placeholder-muted-foreground shadow-sm'
                }`}
              />
              <MagnifyingGlassIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 group-hover:text-purple-500 transition-colors duration-300 ${
                isDarkMode ? 'text-slate-500' : 'text-muted-foreground'
              }`} />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
              {/* Type Filter */}
              <div className="relative group min-w-[140px]">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`w-full appearance-none pl-4 pr-10 py-4 rounded-xl border hover:border-blue-300/40 focus:outline-none focus:ring-0 focus:border-blue-400/60 transition-all duration-300 cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-700/80 border-slate-600/50 hover:border-blue-500/60 focus:border-blue-400/80 text-slate-200 shadow-none'
                      : 'bg-input/60 border-border/20 hover:border-blue-300/40 focus:border-blue-400/60 text-foreground shadow-sm'
                  }`}
                >
                  <option value="">All Types</option>
                  <option value="TV">TV Series</option>
                  <option value="Movie">Movies</option>
                  <option value="OVA">OVA</option>
                  <option value="Special">Special</option>
                </select>
                <ChevronDownIcon className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 group-hover:text-blue-500 transition-colors duration-300 pointer-events-none ${
                  isDarkMode ? 'text-slate-500' : 'text-muted-foreground'
                }`} />
              </div>

              {/* Status Filter */}
              <div className="relative group min-w-[140px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full appearance-none pl-4 pr-10 py-4 rounded-xl border hover:border-pink-300/40 focus:outline-none focus:ring-0 focus:border-pink-400/60 transition-all duration-300 cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-700/80 border-slate-600/50 hover:border-pink-500/60 focus:border-pink-400/80 text-slate-200 shadow-none'
                      : 'bg-input/60 border-border/20 hover:border-pink-300/40 focus:border-pink-400/60 text-foreground shadow-sm'
                  }`}
                >
                  <option value="">All Status</option>
                  <option value="Currently Airing">Currently Airing</option>
                  <option value="Finished Airing">Completed</option>
                  <option value="Not yet aired">Upcoming</option>
                </select>
                <ChevronDownIcon className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 group-hover:text-pink-500 transition-colors duration-300 pointer-events-none ${
                  isDarkMode ? 'text-slate-500' : 'text-muted-foreground'
                }`} />
              </div>

              {/* Sort Dropdown */}
              <div className="relative group min-w-[140px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full appearance-none pl-4 pr-10 py-4 rounded-xl border hover:border-green-300/40 focus:outline-none focus:ring-0 focus:border-green-400/60 transition-all duration-300 cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-700/80 border-slate-600/50 hover:border-green-500/60 focus:border-green-400/80 text-slate-200 shadow-none'
                      : 'bg-input/60 border-border/20 hover:border-green-300/40 focus:border-green-400/60 text-foreground shadow-sm'
                  }`}
                >
                  <option value="score">Top Rated</option>
                  <option value="year">Latest</option>
                  <option value="title">A-Z</option>
                  <option value="episodes">Episodes</option>
                </select>
                <ChevronDownIcon className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 group-hover:text-green-500 transition-colors duration-300 pointer-events-none ${
                  isDarkMode ? 'text-slate-500' : 'text-muted-foreground'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className={`rounded-2xl aspect-[3/4] mb-3 ${
                  isDarkMode ? 'bg-slate-700/60' : 'bg-gray-200/60'
                }`}></div>
                <div className={`h-4 rounded mb-2 ${
                  isDarkMode ? 'bg-slate-700/60' : 'bg-gray-200/60'
                }`}></div>
                <div className={`h-3 rounded w-3/4 ${
                  isDarkMode ? 'bg-slate-700/60' : 'bg-gray-200/60'
                }`}></div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Showing <span className={`font-semibold ${
                  isDarkMode ? 'text-slate-200' : 'text-gray-900'
                }`}>{filteredAnimes.length}</span> of <span className={`font-semibold ${
                  isDarkMode ? 'text-slate-200' : 'text-gray-900'
                }`}>{animes.length}</span> anime
                {searchQuery && (
                  <span> matching "<span className={`font-medium ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>{searchQuery}</span>"</span>
                )}
              </p>
            </div>

            {/* Anime Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAnimes.map((anime) => (
                <EnhancedAnimeCard
                  key={anime.id}
                  anime={{
                    id: anime.id,
                    title: anime.title,
                    imageUrl: anime.imageUrl || '',
                    episodes: anime.episodes || 0,
                    score: anime.score,
                    year: anime.year,
                    synopsis: anime.synopsis,
                  }}
                  isFavorite={isFavorite(anime.id)}
                  isInWatchlist={isInWatchlist(anime.id)}
                  onFavoriteToggle={() => toggleFavorite(anime.id)}
                  onWatchlistToggle={() => addToWatchlist(anime.id)}
                  variant="browse"
                />
              ))}
            </div>

            {/* Load More Button */}
            {filteredAnimes.length > 0 && animes.length >= 20 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={loadingMore}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-700/90 hover:to-blue-700/90 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 backdrop-blur-sm border border-purple-500/20"
                >
                  {loadingMore ? (
                    <span className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}

            {/* No results message */}
            {filteredAnimes.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className={`rounded-2xl p-8 shadow-lg border max-w-md mx-auto backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-slate-800/70 border-slate-700/30' 
                    : 'bg-white/70 border-gray-200/30'
                }`}>
                  <svg className={`w-16 h-16 mx-auto mb-4 ${
                    isDarkMode ? 'text-slate-500' : 'text-gray-400'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? 'text-slate-200' : 'text-gray-900'
                  }`}>No anime found</h3>
                  <p className={`${
                    isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>Try adjusting your search terms or filters to find more results.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 