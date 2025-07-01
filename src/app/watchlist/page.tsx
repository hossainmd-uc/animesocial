'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Header from '@/src/components/layout/Header';
import AnimeCard from '@/src/components/AnimeCard';

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
  { value: 'on_hold', label: 'On Hold' },
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

    return filtered;
  };

  const filteredData = getFilteredData();
  const watchlistCount = userAnimeList.length; // Total count of all anime in watchlist
  const favoritesCount = userAnimeList.filter(item => item.isFavorite).length;

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to view your watchlist and favorites.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Anime Collection</h1>
          <p className="text-gray-600">Manage your watchlist and favorite anime</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'watchlist'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Watchlist ({watchlistCount})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Favorites ({favoritesCount})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
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
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredData.length} anime in {activeTab}
          </p>
        </div>

        {/* Anime Grid */}
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredData.map((item) => (
              <AnimeCard
                key={item.id}
                anime={item.anime}
                status={item.status}
                progress={item.progress}
                isFavorite={item.isFavorite}
                onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                onProgressChange={(newProgress) => handleProgressChange(item.id, newProgress)}
                onFavoriteToggle={() => handleFavoriteToggle(item.id, item.isFavorite)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{activeTab === 'favorites' ? '⭐' : '📺'}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {activeTab} found
            </h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : `Start adding anime to your ${activeTab}!`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 