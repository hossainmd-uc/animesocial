'use client'

import { useState, useEffect } from 'react';
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
    genres?: Array<{ name: string } | string>;
  }>;
}

interface FilterState {
  type: string;
  status: string;
  sortBy: string;
  minScore: number;
  minYear: number;
  maxYear: number;
  genres: string[];
}

interface UserAnime {
  id: string;
  status: string;
  progress: number;
  isFavorite: boolean;
  anime: {
    id: string;
    title: string;
  };
}

export default function DiscoverPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userAnimeList, setUserAnimeList] = useState<UserAnime[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    type: 'All Types',
    status: 'All Status',
    sortBy: 'Top Rated',
    minScore: 0,
    minYear: 1960,
    maxYear: new Date().getFullYear(),
    genres: []
  });

  // Note: Category filtering is now handled by dedicated category pages

  // Available filter options - Only genres that exist in the database
  const genreOptions = [
    'All Genres', 'Action', 'Adventure', 'Award Winning', 'Comedy', 'Drama', 
    'Fantasy', 'Mystery', 'Romance', 'Sci-Fi', 'Sports', 'Supernatural', 'Suspense'
  ];
  const typeOptions = ['All Types', 'TV', 'Movie', 'OVA', 'Special', 'Music'];
  const statusOptions = ['All Status', 'completed', 'ongoing', 'upcoming'];
  const sortOptions = ['Top Rated', 'Most Popular', 'Newest', 'Oldest', 'Most Episodes'];

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    // Fetch more data initially to ensure accurate carousel sections
    fetchSeries(true); // Pass flag for initial load
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserAnimeList();
    }
  }, [user]);

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      fetchSeries();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters]);

  const fetchSeries = async (isInitialLoad = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Use search query for text search with limit, otherwise fetch ALL series
      if (searchQuery) {
        params.append('search', searchQuery);
        params.append('limit', '50'); // Increased search results limit
      } else {
        // Fetch ALL series from database for discover page
        params.append('limit', '1000'); // High limit to get all series
      }
      
      const response = await fetch(`/api/series?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }
      
      const data = await response.json();
      let filteredSeries = data.series || [];
      
      // Note: Genre filtering is now handled by dedicated genre pages (/discover/genre/[genre])
      // Only search and category filtering is done on this page
      
      setSeries(filteredSeries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Note: Category filtering logic moved to dedicated category pages

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

  const addToWatchlist = async (seriesId: string) => {
    if (!user) {
      alert('Please log in to add to watchlist');
      return;
    }

    // Find the series and its main anime
    const targetSeries = series.find(s => s.id === seriesId);
    if (!targetSeries || !targetSeries.animes.length) return;

    const mainAnime = targetSeries.animes.find(a => a.seriesType === 'main') || targetSeries.animes[0];
    const animeId = mainAnime.id;

    const existingEntry = userAnimeList.find(item => item.anime.id === animeId);
    
    if (existingEntry) {
      console.log('Anime already in watchlist');
      return;
    }

    try {
      const response = await fetch('/api/user/anime-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeId, status: 'Plan to Watch', isFavorite: false }),
      });

      if (response.ok) {
        await fetchUserAnimeList();
        console.log('Added to watchlist!');
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const toggleFavorite = async (seriesId: string) => {
    if (!user) {
      alert('Please log in to add to favorites');
      return;
    }

    // Find the series and its main anime
    const targetSeries = series.find(s => s.id === seriesId);
    if (!targetSeries || !targetSeries.animes.length) return;

    const mainAnime = targetSeries.animes.find(a => a.seriesType === 'main') || targetSeries.animes[0];
    const animeId = mainAnime.id;

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
          console.log(existingEntry.isFavorite ? 'Removed from favorites' : 'Added to favorites!');
        }
      } catch (error) {
        console.error('Error updating favorite:', error);
      }
    } else {
      try {
        const response = await fetch('/api/user/anime-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ animeId, status: 'Plan to Watch', isFavorite: true }),
        });

        if (response.ok) {
          await fetchUserAnimeList();
          console.log('Added to favorites!');
        }
      } catch (error) {
        console.error('Error adding to favorites:', error);
      }
    }
  };

  const isInWatchlist = (seriesId: string) => {
    const targetSeries = series.find(s => s.id === seriesId);
    if (!targetSeries || !targetSeries.animes.length) return false;

    const mainAnime = targetSeries.animes.find(a => a.seriesType === 'main') || targetSeries.animes[0];
    return userAnimeList.some(item => item.anime.id === mainAnime.id);
  };

  const isFavorite = (seriesId: string) => {
    const targetSeries = series.find(s => s.id === seriesId);
    if (!targetSeries || !targetSeries.animes.length) return false;

    const mainAnime = targetSeries.animes.find(a => a.seriesType === 'main') || targetSeries.animes[0];
    return userAnimeList.some(item => item.anime.id === mainAnime.id && item.isFavorite);
  };

  const handleOpenDetails = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setShowModal(true);
  };

  const handleFilterChange = (filterType: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleGenreFilter = (genre: string) => {
    if (genre === 'All Genres') {
      // Stay on current page (no action needed for "All Genres")
      return;
    } else {
      // Navigate to the dedicated genre page
      window.location.href = `/discover/genre/${encodeURIComponent(genre.toLowerCase())}`;
    }
  };

  const clearFilters = () => {
    setFilters({
      type: 'All Types',
      status: 'All Status',
      sortBy: 'Top Rated',
      minScore: 0,
      minYear: 1960,
      maxYear: new Date().getFullYear(),
      genres: []
    });
    setSearchQuery('');
  };

  // Categorize series into gamer-themed sections
  const getSectionData = (section: string): Series[] => {
    switch (section) {
      case 's-tier':
        return series.filter(s => s.averageScore && s.averageScore >= 9.0);
      case 'a-rank':
        return series.filter(s => s.averageScore && s.averageScore >= 8.5 && s.averageScore < 9.0);
      case 'quick-missions':
        return series.filter(s => {
          // Only include series where ALL content is short (≤12 episodes) or movies
          // Exclude series that have any long content (>12 episodes)
          const hasLongContent = s.animes.some(a => a.episodes && a.episodes > 12);
          if (hasLongContent) return false;
          
          // Include if it has movies OR short series (but no long content)
          const hasMovies = s.animes.some(a => a.type === 'Movie');
          const hasShortSeries = s.animes.some(a => a.episodes && a.episodes <= 12);
          return hasMovies || hasShortSeries;
        });
      case 'campaign-mode':
        return series.filter(s => {
          // Include series that have any long content (>12 episodes)
          const hasLongContent = s.animes.some(a => a.episodes && a.episodes > 12);
          return hasLongContent;
        });
      default:
        return [];
    }
  };

  // Handle category browse - navigate to dedicated category page
  const handleCategoryBrowse = (category: string) => {
    // Navigate to the dedicated category page
    window.location.href = `/discover/${category}`;
  };

  // Note: Category filtering functionality moved to dedicated category pages

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
      
      <main className="container mx-auto px-6 py-12 relative z-10" style={{overflow: 'visible'}}>
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="relative">
            <h1 className={`text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight`}>
            Discover Anime
          </h1>
            <div className={`absolute -inset-1 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 blur-3xl -z-10 ${
              isDarkMode ? 'opacity-40' : 'opacity-20'
            }`}></div>
          </div>
          <p className={`text-xl md:text-2xl mb-16 max-w-4xl mx-auto leading-relaxed font-light ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Explore anime series with all seasons, movies, and OVAs organized together
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search anime series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-8 py-6 rounded-3xl text-lg focus:outline-none focus:ring-4 transition-all duration-300 backdrop-blur-xl gamer-card-hover ${
                  isDarkMode
                    ? 'bg-gray-800/70 text-white border-gray-600/30 focus:ring-purple-500/50 focus:border-purple-500 placeholder-gray-400'
                    : 'bg-white/70 text-gray-900 border-gray-200/30 focus:ring-purple-500/50 focus:border-purple-500 placeholder-gray-500'
                } border-2 shadow-xl`}
              />
              <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                isDarkMode ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10' : 'bg-gradient-to-r from-purple-500/5 to-blue-500/5'
              } pointer-events-none`}></div>
            </div>
          </div>

          {/* Genre Filter Buttons */}
          <div className="mb-12">
            <h3 className={`text-center text-lg font-semibold mb-6 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              Browse by Genre
            </h3>
                         <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
               {genreOptions.map((genre) => (
                <button
                   key={genre}
                   onClick={() => handleGenreFilter(genre)}
                                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-xl gamer-card-hover shadow-lg hover:scale-105 ${
                     genre === 'All Genres' 
                       ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                       : isDarkMode
                         ? 'bg-gray-800/60 text-gray-300 hover:bg-purple-600/80 hover:text-white border border-gray-700/30'
                         : 'bg-white/60 text-gray-700 hover:bg-purple-600/80 hover:text-white border border-gray-200/30'
                   }`}
                >
                   {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className={`max-w-4xl mx-auto p-6 rounded-2xl mb-6 transition-all duration-300 ${
              isDarkMode ? 'bg-slate-800' : 'bg-white'
            } shadow-lg`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Type Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {typeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {statusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {sortOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {/* Min Score */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Min Score: {filters.minScore}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.minScore}
                    onChange={(e) => handleFilterChange('minScore', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Year Range */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Year: {filters.minYear} - {filters.maxYear}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1960"
                      max={new Date().getFullYear()}
                      value={filters.minYear}
                      onChange={(e) => handleFilterChange('minYear', parseInt(e.target.value))}
                      className={`w-full px-2 py-1 rounded border ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="number"
                      min="1960"
                      max={new Date().getFullYear()}
                      value={filters.maxYear}
                      onChange={(e) => handleFilterChange('maxYear', parseInt(e.target.value))}
                      className={`w-full px-2 py-1 rounded border ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clear Filters Section - Only show if filters are active */}
        {(searchQuery || filters.type !== 'All Types' || filters.status !== 'All Status') && (
          <div className="flex justify-center mb-8">
              <button
                onClick={clearFilters}
              className={`px-8 py-3 rounded-2xl font-medium transition-all duration-300 gamer-card-hover backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-red-900/40 text-red-300 hover:bg-red-800/50 border border-red-700/30' 
                  : 'bg-red-50/60 text-red-600 hover:bg-red-100/60 border border-red-200/30'
              }`}
            >
              Clear all filters
              </button>
          </div>
        )}

        {/* Content */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600/30 border-t-purple-600 mb-6"></div>
            <p className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Discovering amazing anime...</p>
          </div>
        )}

        {error && (
          <div className="flex justify-center py-24">
            <div className={`text-center backdrop-blur-xl rounded-3xl p-10 max-w-md gamer-card-hover ${
              isDarkMode ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50/60 border border-red-200/30'
          }`}>
              <p className={`text-2xl mb-6 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>⚠️ {error}</p>
            <button
              onClick={() => fetchSeries()}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium gamer-card-hover"
            >
              Try Again
            </button>
            </div>
          </div>
        )}

        {!loading && !error && series.length === 0 && (
          <div className="flex justify-center py-24">
            <div className={`text-center backdrop-blur-xl rounded-3xl p-10 max-w-md gamer-card-hover ${
              isDarkMode ? 'bg-gray-800/30 border border-gray-700/30' : 'bg-white/60 border border-gray-200/30'
          }`}>
              <p className={`text-2xl mb-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>📺 No series found</p>
            {searchQuery && (
                <p className={`${
                  isDarkMode ? 'text-gray-500' : 'text-gray-700'
                }`}>Try adjusting your search terms or filters</p>
            )}
            </div>
          </div>
        )}

        {!loading && !error && series.length > 0 && (
          <div className="gamer-carousel-container space-y-16">
            {/* S-Tier Legends */}
            {getSectionData('s-tier').length > 0 && (
              <div className="gamer-section s-tier-section">
                <div className="section-header">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="gamer-rank-badge s-tier">S</div>
                      <div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                          S-Tier Legends
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Rating 9.0+</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCategoryBrowse('s-tier')}
                      className="browse-button s-tier-browse"
                    >
                      <span>View All ({getSectionData('s-tier').length})</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="gamer-carousel">
                  <div className="carousel-track">
                    {getSectionData('s-tier').map((seriesItem: Series, index: number) => (
                      <div key={seriesItem.id} className="carousel-item">
              <EnhancedSeriesCard
                series={seriesItem}
                onOpenDetails={handleOpenDetails}
                onFavoriteToggle={() => toggleFavorite(seriesItem.id)}
                onWatchlistToggle={() => addToWatchlist(seriesItem.id)}
                isFavorite={isFavorite(seriesItem.id)}
                isInWatchlist={isInWatchlist(seriesItem.id)}
              />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* A-Rank Champions */}
            {getSectionData('a-rank').length > 0 && (
              <div className="gamer-section a-rank-section">
                <div className="section-header">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="gamer-rank-badge a-rank">A</div>
                      <div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                          A-Rank Champions
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Rating 8.5-8.9</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCategoryBrowse('a-rank')}
                      className="browse-button a-rank-browse"
                    >
                      <span>View All ({getSectionData('a-rank').length})</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="gamer-carousel">
                  <div className="carousel-track">
                    {getSectionData('a-rank').map((seriesItem: Series, index: number) => (
                      <div key={seriesItem.id} className="carousel-item">
                        <EnhancedSeriesCard
                          series={seriesItem}
                          onOpenDetails={handleOpenDetails}
                          onFavoriteToggle={() => toggleFavorite(seriesItem.id)}
                          onWatchlistToggle={() => addToWatchlist(seriesItem.id)}
                          isFavorite={isFavorite(seriesItem.id)}
                          isInWatchlist={isInWatchlist(seriesItem.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Missions */}
            {getSectionData('quick-missions').length > 0 && (
              <div className="gamer-section quick-missions-section">
                <div className="section-header">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="gamer-rank-badge mission">⚡</div>
                      <div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">
                          Quick Missions
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Short Content Only</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCategoryBrowse('quick-missions')}
                      className="browse-button mission-browse"
                    >
                      <span>View All ({getSectionData('quick-missions').length})</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="gamer-carousel">
                  <div className="carousel-track">
                    {getSectionData('quick-missions').map((seriesItem: Series, index: number) => (
                      <div key={seriesItem.id} className="carousel-item">
                        <EnhancedSeriesCard
                          series={seriesItem}
                          onOpenDetails={handleOpenDetails}
                          onFavoriteToggle={() => toggleFavorite(seriesItem.id)}
                          onWatchlistToggle={() => addToWatchlist(seriesItem.id)}
                          isFavorite={isFavorite(seriesItem.id)}
                          isInWatchlist={isInWatchlist(seriesItem.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Campaign Mode */}
            {getSectionData('campaign-mode').length > 0 && (
              <div className="gamer-section campaign-mode-section">
                <div className="section-header">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="gamer-rank-badge campaign">📺</div>
                      <div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                          Campaign Mode
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Long Series</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCategoryBrowse('campaign-mode')}
                      className="browse-button campaign-browse"
                    >
                      <span>View All ({getSectionData('campaign-mode').length})</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="gamer-carousel">
                  <div className="carousel-track">
                    {getSectionData('campaign-mode').map((seriesItem: Series, index: number) => (
                      <div key={seriesItem.id} className="carousel-item">
                        <EnhancedSeriesCard
                          series={seriesItem}
                          onOpenDetails={handleOpenDetails}
                          onFavoriteToggle={() => toggleFavorite(seriesItem.id)}
                          onWatchlistToggle={() => addToWatchlist(seriesItem.id)}
                          isFavorite={isFavorite(seriesItem.id)}
                          isInWatchlist={isInWatchlist(seriesItem.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Series Details Modal */}
      {selectedSeriesId && (
        <SeriesDetailsModal
          seriesId={selectedSeriesId}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSeriesId(null);
          }}
        />
      )}
    </div>
  );
}

// Note: Using the extracted EnhancedSeriesCard component 