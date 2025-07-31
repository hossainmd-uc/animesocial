'use client'

import { useState, useEffect } from 'react';
import Header from '@/src/components/layout/Header';
import SeriesCard from '@/src/components/SeriesCard';
import SeriesDetailsModal from '@/src/components/SeriesDetailsModal';
import { useDarkMode } from '@/src/hooks/useDarkMode';

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

interface FilterState {
  type: string;
  status: string;
  sortBy: string;
  minScore: number;
  minYear: number;
  maxYear: number;
  genres: string[];
}

export default function SearchPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    type: 'All Types',
    status: 'All Status',
    sortBy: 'Top Rated',
    minScore: 0,
    minYear: 1960,
    maxYear: new Date().getFullYear(),
    genres: []
  });

  // Available filter options
  const typeOptions = ['All Types', 'TV', 'Movie', 'OVA', 'Special', 'Music'];
  const statusOptions = ['All Status', 'completed', 'ongoing', 'upcoming'];
  const sortOptions = ['Top Rated', 'Most Popular', 'Newest', 'Oldest', 'Most Episodes'];
  const genreOptions = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Horror', 'Slice of Life', 'Sports', 'Supernatural'];

  useEffect(() => {
    fetchSeries();
  }, []);

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      fetchSeries();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters]);

  const fetchSeries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '24');
      
      const response = await fetch(`/api/series?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }
      
      const data = await response.json();
      setSeries(data.series || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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

  if (!mounted) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Search Anime Series
          </h1>
          <p className={`text-lg mb-8 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Explore anime series with all seasons, movies, and OVAs organized together
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search anime series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-6 py-4 rounded-2xl text-lg focus:outline-none focus:ring-4 transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-slate-800 text-white border-slate-600 focus:ring-purple-500/50 focus:border-purple-500'
                    : 'bg-white text-gray-900 border-gray-200 focus:ring-purple-500/50 focus:border-purple-500'
                } border-2`}
              />
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Filter Toggles */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {/* Basic Filter Buttons */}
            <button
              onClick={() => handleFilterChange('type', filters.type === 'All Types' ? 'TV' : 'All Types')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                filters.type !== 'All Types'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : isDarkMode
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filters.type}
            </button>

            <button
              onClick={() => handleFilterChange('status', filters.status === 'All Status' ? 'completed' : 'All Status')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                filters.status !== 'All Status'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : isDarkMode
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filters.status}
            </button>

            <button
              onClick={() => handleFilterChange('sortBy', filters.sortBy === 'Top Rated' ? 'Most Popular' : 'Top Rated')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                'bg-purple-600 text-white shadow-lg'
              }`}
            >
              {filters.sortBy}
            </button>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                showAdvancedFilters
                  ? 'bg-blue-600 text-white shadow-lg'
                  : isDarkMode
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Advanced Filters {showAdvancedFilters ? '▼' : '▶'}
            </button>
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

        {/* Results Section */}
        <div className="mb-6">
          <div className={`flex items-center justify-between mb-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span>
              Showing {series.length} of {series.length} series
              {searchQuery && ` for "${searchQuery}"`}
            </span>
            {(searchQuery || filters.type !== 'All Types' || filters.status !== 'All Status') && (
              <button
                onClick={clearFilters}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {error && (
          <div className={`text-center py-20 ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            <p className="text-xl mb-4">😞 {error}</p>
            <button
              onClick={fetchSeries}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && series.length === 0 && (
          <div className={`text-center py-20 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p className="text-xl mb-4">📺 No series found</p>
            {searchQuery && (
              <p>Try adjusting your search terms or filters</p>
            )}
          </div>
        )}

        {!loading && !error && series.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {series.map((seriesItem) => (
              <SeriesCard
                key={seriesItem.id}
                series={seriesItem}
                onOpenDetails={handleOpenDetails}
              />
            ))}
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