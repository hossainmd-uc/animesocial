'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/src/components/layout/Header';
import EnhancedSeriesCard from '@/src/components/EnhancedSeriesCard';
import SeriesDetailsModal from '@/src/components/SeriesDetailsModal';
import { useDarkMode } from '@/src/hooks/useDarkMode';
import { createClient } from '@/src/lib/supabase/client';

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
  animes: Array<{
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
  }>;
}



interface UserAnime {
  id: string;
  status: string;
  progress: number;
  isFavorite: boolean;
  anime: {
    id: string;
    title: string;
    imageUrl: string;
  };
}

interface CategoryInfo {
  title: string;
  description: string;
  gradient: string;
  icon: string;
}

const categoryData: { [key: string]: CategoryInfo } = {
  's-tier': {
    title: 'S-Tier Legends',
    description: 'The absolute pinnacle of anime excellence with 9.0+ ratings',
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
    icon: '👑'
  },
  'a-rank': {
    title: 'A-Rank Champions',
    description: 'Elite tier anime with exceptional 8.5+ ratings',
    gradient: 'from-blue-400 via-purple-500 to-pink-600',
    icon: '⭐'
  },
  'quick-missions': {
    title: 'Quick Missions',
    description: 'Perfect for short sessions - movies and series ≤12 episodes',
    gradient: 'from-green-400 via-cyan-500 to-blue-600',
    icon: '⚡'
  },
  'campaign-mode': {
    title: 'Campaign Mode',
    description: 'Epic long-running adventures with extensive episode counts',
    gradient: 'from-purple-400 via-pink-500 to-red-600',
    icon: '🎮'
  }
};

export default function CategoryPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const params = useParams();
  const router = useRouter();
  const category = params?.category as string;

  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userAnimeList, setUserAnimeList] = useState<UserAnime[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('Top Rated');

  const categoryInfo = categoryData[category] || {
    title: 'Unknown Category',
    description: 'Category not found',
    gradient: 'from-gray-400 to-gray-600',
    icon: '❓'
  };

  const sortOptions = ['Top Rated', 'Most Popular', 'Newest', 'Oldest', 'Most Episodes', 'Alphabetical'];

  useEffect(() => {
    if (category) {
      fetchCategorySeries();
    }
  }, [category, sortBy]);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserAnimeList();
    }
  }, [user]);

  const fetchCategorySeries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch a larger dataset to ensure complete filtering
      const response = await fetch(`/api/series?limit=200`);
      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }
      
      const data = await response.json();
      let filteredSeries = applyCategoryFilter(data.series || [], category);
      
      // Apply sorting
      filteredSeries = applySorting(filteredSeries, sortBy);
      
      setSeries(filteredSeries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnimeList = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/user/anime-list');
      if (response.ok) {
        const data = await response.json();
        setUserAnimeList(data.animeList || []);
      }
    } catch (error) {
      console.error('Error fetching user anime list:', error);
    }
  };

  const toggleFavorite = async (seriesId: string) => {
    if (!user) return;
    
    const mainAnime = series.find(s => s.id === seriesId)?.animes[0];
    if (!mainAnime) return;

    try {
      const response = await fetch('/api/user/anime-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId: mainAnime.id,
          isFavorite: !isFavorite(seriesId)
        })
      });

      if (response.ok) {
        fetchUserAnimeList();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const addToWatchlist = async (seriesId: string) => {
    if (!user) return;
    
    const mainAnime = series.find(s => s.id === seriesId)?.animes[0];
    if (!mainAnime) return;

    try {
      const response = await fetch('/api/user/anime-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId: mainAnime.id,
          status: 'plan_to_watch'
        })
      });

      if (response.ok) {
        fetchUserAnimeList();
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const isFavorite = (seriesId: string) => {
    const mainAnime = series.find(s => s.id === seriesId)?.animes[0];
    if (!mainAnime) return false;
    
    return userAnimeList.some(item => 
      item.anime.id === mainAnime.id && item.isFavorite
    );
  };

  const isInWatchlist = (seriesId: string) => {
    const mainAnime = series.find(s => s.id === seriesId)?.animes[0];
    if (!mainAnime) return false;
    
    return userAnimeList.some(item => item.anime.id === mainAnime.id);
  };

  const handleOpenDetails = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setShowModal(true);
  };

  // Apply category filtering using the same logic as discover page
  const applyCategoryFilter = (seriesData: Series[], category: string): Series[] => {
    switch (category) {
      case 's-tier':
        return seriesData.filter(s => s.averageScore && s.averageScore >= 9.0);
      case 'a-rank':
        return seriesData.filter(s => s.averageScore && s.averageScore >= 8.5 && s.averageScore < 9.0);
      case 'quick-missions':
        return seriesData.filter(s => {
          const hasLongContent = s.animes.some(a => a.episodes && a.episodes > 12);
          if (hasLongContent) return false;
          
          const hasMovies = s.animes.some(a => a.type === 'Movie');
          const hasShortSeries = s.animes.some(a => a.episodes && a.episodes <= 12);
          return hasMovies || hasShortSeries;
        });
      case 'campaign-mode':
        return seriesData.filter(s => {
          const hasLongContent = s.animes.some(a => a.episodes && a.episodes > 12);
          return hasLongContent;
        });
      default:
        return seriesData;
    }
  };

  const applySorting = (seriesData: Series[], sortBy: string): Series[] => {
    const sorted = [...seriesData];
    
    switch (sortBy) {
      case 'Top Rated':
        return sorted.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
      case 'Most Popular':
        return sorted.sort((a, b) => (b.animeCount || 0) - (a.animeCount || 0));
      case 'Newest':
        return sorted.sort((a, b) => (b.startYear || 0) - (a.startYear || 0));
      case 'Oldest':
        return sorted.sort((a, b) => (a.startYear || 0) - (b.startYear || 0));
      case 'Most Episodes':
        return sorted.sort((a, b) => (b.totalEpisodes || 0) - (a.totalEpisodes || 0));
      case 'Alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };



  if (!mounted) {
    return null;
  }

  return (
    <div className={`min-h-screen gamer-gradient transition-colors duration-300 relative`}>
      {/* Enhanced Floating Particles Background */}
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle particle-hex"></div>
        <div className="particle particle-hex"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle particle-hex"></div>
        <div className="particle"></div>
      </div>

      <Header />

      <main className="container mx-auto px-4 py-10" style={{overflow: 'visible'}}>
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Back Button */}
          <div className="flex justify-start mb-8">
            <button
              onClick={() => router.back()}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 gamer-card-hover backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-gray-800/40 text-gray-300 hover:bg-gray-700/50 border border-gray-700/30' 
                  : 'bg-white/40 text-gray-700 hover:bg-white/60 border border-gray-200/30'
              }`}
            >
              ← Back to Discover
            </button>
          </div>

          {/* Category Title */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-6xl">{categoryInfo.icon}</span>
              <h1 className={`text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${categoryInfo.gradient}`}>
                {categoryInfo.title}
              </h1>
            </div>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {categoryInfo.description}
            </p>
          </div>

          {/* Stats and Sorting */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className={`backdrop-blur-xl rounded-2xl px-6 py-4 gamer-card-hover ${
              isDarkMode ? 'bg-gray-800/40 border border-gray-700/30' : 'bg-white/40 border border-gray-200/30'
            }`}>
              <span className={`text-lg font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Found <span className="text-purple-500 font-bold">{series.length}</span> series
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-xl ${
                  isDarkMode 
                    ? 'bg-gray-800/60 text-gray-300 border border-gray-700/30 focus:border-purple-500' 
                    : 'bg-white/60 text-gray-700 border border-gray-200/30 focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
              >
                {sortOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600/30 border-t-purple-600 mb-6"></div>
            <p className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Loading {categoryInfo.title.toLowerCase()}...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col justify-center items-center py-24">
            <div className={`text-center backdrop-blur-xl rounded-2xl px-8 py-12 gamer-card-hover ${
              isDarkMode ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50/60 border border-red-200/30'
            }`}>
              <p className={`text-2xl mb-6 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>⚠️ {error}</p>
              <button
                onClick={() => fetchCategorySeries()}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium gamer-card-hover"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && series.length === 0 && (
          <div className="flex flex-col justify-center items-center py-24">
            <div className={`text-center backdrop-blur-xl rounded-2xl px-8 py-12 gamer-card-hover ${
              isDarkMode ? 'bg-gray-800/40 border border-gray-700/30' : 'bg-white/40 border border-gray-200/30'
            }`}>
              <span className="text-6xl mb-6 block">🔍</span>
              <h2 className={`text-2xl font-bold mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>No series found in this category</h2>
              <p className={`text-lg ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Try checking back later or explore other categories</p>
            </div>
          </div>
        )}

        {!loading && !error && series.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-8">
              {series.map((seriesItem) => (
                <EnhancedSeriesCard
                  key={seriesItem.id}
                  series={seriesItem}
                  onOpenDetails={() => handleOpenDetails(seriesItem.id)}
                  onFavoriteToggle={() => toggleFavorite(seriesItem.id)}
                  onWatchlistToggle={() => addToWatchlist(seriesItem.id)}
                  isFavorite={isFavorite(seriesItem.id)}
                  isInWatchlist={isInWatchlist(seriesItem.id)}
                />
              ))}
            </div>
        )}

        {/* Series Details Modal */}
        {showModal && selectedSeriesId && (
          <SeriesDetailsModal
            seriesId={selectedSeriesId}
            onClose={() => {
              setShowModal(false);
              setSelectedSeriesId(null);
            }}
            onAddToWatchlist={() => addToWatchlist(selectedSeriesId)}
            onToggleFavorite={() => toggleFavorite(selectedSeriesId)}
            userAnimeList={userAnimeList}
          />
        )}
      </main>
    </div>
  );
} 