'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Header from '@/src/components/layout/Header';
import EnhancedAnimeCard from '@/src/components/EnhancedAnimeCard';
import { useDarkMode } from '@/src/hooks/useDarkMode';

interface Anime {
  id: string;
  title: string;
  imageUrl: string;
  episodes: number;
}

interface UserAnime {
  id: string;
  status: string;
  progress: number;
  isFavorite: boolean;
  anime: Anime;
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'plan_to_watch', label: 'Plan to Watch' },
];

export default function WatchlistPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userAnimeList, setUserAnimeList] = useState<UserAnime[]>([]);
  const [activeTab, setActiveTab] = useState<'watchlist' | 'favorites'>('watchlist');
  const { isDarkMode, mounted } = useDarkMode();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchUserLists();
      }
      setLoading(false);
    };
    getUser();
  }, []);

  // Handle URL parameters to set active tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'favorites') {
      setActiveTab('favorites');
    }
  }, [searchParams]);

  const fetchUserLists = async () => {
    try {
      const response = await fetch('/api/user/anime-list');
      const data = await response.json();
      setUserAnimeList(data);
    } catch (error) {
      console.error('Error fetching user lists:', error);
    }
  };

  const handleStatusChange = async (animeId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/user/anime-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: animeId, status: newStatus }),
      });

      if (response.ok) {
        await fetchUserLists();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleProgressChange = async (animeId: string, newProgress: number) => {
    try {
      const response = await fetch('/api/user/anime-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: animeId, progress: newProgress }),
      });

      if (response.ok) {
        await fetchUserLists();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleFavoriteToggle = async (animeId: string, currentIsFavorite: boolean) => {
    try {
      const response = await fetch('/api/user/anime-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: animeId, isFavorite: !currentIsFavorite }),
      });

      if (response.ok) {
        await fetchUserLists();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleRemoveAnime = async (animeId: string) => {
    if (!confirm('Are you sure you want to remove this anime from your watchlist?')) {
      return;
    }

    try {
      const response = await fetch('/api/user/anime-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: animeId }),
      });

      if (response.ok) {
        await fetchUserLists();
      }
    } catch (error) {
      console.error('Error removing anime:', error);
    }
  };

  // Filter data based on active tab
  const getFilteredData = () => {
    const baseData = activeTab === 'favorites' 
      ? userAnimeList.filter(item => item.isFavorite)
      : userAnimeList; // Show all items in watchlist (both favorited and non-favorited)

    let filtered = baseData;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.anime.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by status priority: Watching → Completed → Dropped → Plan to Watch
    const statusPriority = {
      'watching': 1,
      'completed': 2,
      'dropped': 3,
      'plan_to_watch': 4
    };

    filtered.sort((a, b) => {
      const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 5;
      const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 5;
      
      // First sort by status priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, sort alphabetically by title
      return a.anime.title.localeCompare(b.anime.title);
    });

    return filtered;
  };

  const filteredData = getFilteredData();
  const watchlistCount = userAnimeList.length; // Total count of all anime in watchlist
  const favoritesCount = userAnimeList.filter(item => item.isFavorite).length;

  if (loading || !mounted) {
    return (
      <div className="min-h-screen smooth-gradient transition-all duration-500">
        <Header />
        <div className="content-wrapper section-padding py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading your collection...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen smooth-gradient transition-all duration-500">
        <Header />
        <div className="content-wrapper section-padding py-8">
          <div className="text-center py-20">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className={`text-2xl font-bold mb-3 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>Authentication Required</h2>
            <p className={`${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Please sign in to view your watchlist and favorites.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen smooth-gradient transition-all duration-500">
      <Header />
      
      <div className="content-wrapper section-padding py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-3 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>My Collection</h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Manage your anime watchlist and discover your favorites</p>
        </div>

        {/* Tabs */}
        <div className={`flex space-x-1 backdrop-blur-lg p-1.5 rounded-2xl mb-8 w-fit border ${
          isDarkMode 
            ? 'bg-gray-800/80 border-gray-700' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'watchlist'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-700 hover:scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>Watchlist</span>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                activeTab === 'watchlist' 
                  ? 'bg-white/20 text-white' 
                  : isDarkMode
                    ? 'bg-gray-600 text-gray-300'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {watchlistCount}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'favorites'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-700 hover:scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>Favorites</span>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                activeTab === 'favorites' 
                  ? 'bg-white/20 text-white' 
                  : isDarkMode
                    ? 'bg-gray-600 text-gray-300'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {favoritesCount}
              </span>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-xl backdrop-blur-lg border hover:border-purple-400 focus:outline-none focus:ring-0 focus:border-purple-500 transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gray-800/80 border-gray-700 hover:border-purple-500 focus:border-purple-400 text-gray-100 placeholder-gray-400'
                  : 'bg-white/80 border-gray-200 hover:border-purple-400 focus:border-purple-500 text-gray-900 placeholder-gray-500'
              }`}
            />
            <MagnifyingGlassIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 group-hover:text-purple-500 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`appearance-none backdrop-blur-lg border hover:border-blue-400 rounded-xl px-4 py-4 pr-10 focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-300 min-w-[180px] ${
                isDarkMode
                  ? 'bg-gray-800/80 border-gray-700 hover:border-blue-500 focus:border-blue-400 text-gray-100'
                  : 'bg-white/80 border-gray-200 hover:border-blue-400 focus:border-blue-500 text-gray-900'
              }`}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FunnelIcon className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 group-hover:text-blue-500 transition-colors duration-300 pointer-events-none ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing <span className={`font-semibold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>{filteredData.length}</span> anime in {activeTab}
          </p>
        </div>

        {/* Anime Grid */}
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredData.map((item) => (
              <EnhancedAnimeCard
                key={item.id}
                anime={item.anime}
                status={item.status}
                progress={item.progress}
                isFavorite={item.isFavorite}
                onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                onProgressChange={(newProgress) => handleProgressChange(item.id, newProgress)}
                onFavoriteToggle={() => handleFavoriteToggle(item.id, item.isFavorite)}
                onRemove={() => handleRemoveAnime(item.id)}
                variant="watchlist"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <span className="text-3xl">{activeTab === 'favorites' ? '⭐' : '📺'}</span>
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              No {activeTab} found
            </h3>
            <p className={`max-w-md mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : `Start adding anime to your ${activeTab} to build your collection!`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 