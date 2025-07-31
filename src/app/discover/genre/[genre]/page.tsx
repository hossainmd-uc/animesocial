'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import EnhancedSeriesCard from '@/src/components/EnhancedSeriesCard';
import SeriesDetailsModal from '@/src/components/SeriesDetailsModal';
import { createClient } from '@/src/lib/supabase/client';

interface AnimeEntry {
  id: string;
  title: string;
  titleEnglish?: string;
  episodes?: number;
  score?: number;
  year?: number;
  type?: string;
  seriesType?: string;
  seriesOrder?: number;
  imageUrl?: string;
  status?: string;
  synopsis?: string;
  genres?: Array<{ genre: { name: string; id: string } }>;
}

interface Series {
  id: string;
  title: string;
  animes: AnimeEntry[];
  _count: { animes: number };
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

interface GenrePageProps {
  params: Promise<{
    genre: string;
  }>;
}

const GenrePage = ({ params }: GenrePageProps) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted ? theme === 'dark' : false; // Default to light mode during SSR
  
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [genreName, setGenreName] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [userAnimeList, setUserAnimeList] = useState<UserAnime[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle async params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      const decodedGenre = decodeURIComponent(resolvedParams.genre);
      setGenreName(decodedGenre);
    };
    getParams();
  }, [params]);
  
  // Genre-specific styling and info
  const getGenreInfo = (genre: string) => {
    const genreMap: Record<string, { 
      title: string; 
      description: string; 
      icon: string; 
      gradient: string;
      bgGradient: string;
    }> = {
      'action': {
        title: 'Action Anime',
        description: 'High-octane series packed with intense fights, thrilling chases, and adrenaline-pumping sequences',
        icon: '⚔️',
        gradient: 'from-red-600 via-orange-500 to-yellow-500',
        bgGradient: 'from-red-900/20 via-orange-900/10 to-yellow-900/5'
      },
      'adventure': {
        title: 'Adventure Anime',
        description: 'Epic journeys and exciting quests that take you to amazing worlds and distant lands',
        icon: '🗺️',
        gradient: 'from-green-600 via-emerald-500 to-teal-500',
        bgGradient: 'from-green-900/20 via-emerald-900/10 to-teal-900/5'
      },
      'comedy': {
        title: 'Comedy Anime',
        description: 'Hilarious series that will make you laugh out loud with clever humor and funny situations',
        icon: '😂',
        gradient: 'from-yellow-500 via-amber-500 to-orange-500',
        bgGradient: 'from-yellow-900/20 via-amber-900/10 to-orange-900/5'
      },
      'drama': {
        title: 'Drama Anime',
        description: 'Emotionally compelling stories that explore deep human relationships and life experiences',
        icon: '🎭',
        gradient: 'from-purple-600 via-violet-500 to-indigo-500',
        bgGradient: 'from-purple-900/20 via-violet-900/10 to-indigo-900/5'
      },
      'fantasy': {
        title: 'Fantasy Anime',
        description: 'Magical worlds filled with mythical creatures, spells, and extraordinary adventures',
        icon: '🔮',
        gradient: 'from-pink-600 via-purple-500 to-violet-500',
        bgGradient: 'from-pink-900/20 via-purple-900/10 to-violet-900/5'
      },
      'romance': {
        title: 'Romance Anime',
        description: 'Heartwarming love stories that explore the beautiful complexities of relationships',
        icon: '💕',
        gradient: 'from-pink-500 via-rose-500 to-red-500',
        bgGradient: 'from-pink-900/20 via-rose-900/10 to-red-900/5'
      },
      'sci-fi': {
        title: 'Sci-Fi Anime',
        description: 'Futuristic tales of technology, space exploration, and scientific wonders',
        icon: '🚀',
        gradient: 'from-blue-600 via-cyan-500 to-teal-500',
        bgGradient: 'from-blue-900/20 via-cyan-900/10 to-teal-900/5'
      },
      'mystery': {
        title: 'Mystery Anime',
        description: 'Intriguing puzzles and suspenseful investigations that keep you guessing',
        icon: '🔍',
        gradient: 'from-gray-700 via-slate-600 to-zinc-600',
        bgGradient: 'from-gray-900/20 via-slate-900/10 to-zinc-900/5'
      },
      'sports': {
        title: 'Sports Anime',
        description: 'Competitive athletics and the spirit of teamwork, determination, and victory',
        icon: '⚽',
        gradient: 'from-green-600 via-lime-500 to-emerald-500',
        bgGradient: 'from-green-900/20 via-lime-900/10 to-emerald-900/5'
      },
      'supernatural': {
        title: 'Supernatural Anime',
        description: 'Mysterious forces beyond the natural world with paranormal and mystical elements',
        icon: '👻',
        gradient: 'from-indigo-600 via-purple-500 to-pink-500',
        bgGradient: 'from-indigo-900/20 via-purple-900/10 to-pink-900/5'
      },
      'award winning': {
        title: 'Award Winning Anime',
        description: 'Critically acclaimed masterpieces recognized for their exceptional quality',
        icon: '🏆',
        gradient: 'from-yellow-600 via-amber-500 to-orange-500',
        bgGradient: 'from-yellow-900/20 via-amber-900/10 to-orange-900/5'
      },
      'suspense': {
        title: 'Suspense Anime',
        description: 'Thrilling narratives that keep you on the edge of your seat with tension',
        icon: '😱',
        gradient: 'from-red-700 via-crimson-600 to-red-600',
        bgGradient: 'from-red-900/20 via-crimson-900/10 to-red-900/5'
      }
    };
    
    return genreMap[genre.toLowerCase()] || {
      title: `${genre} Anime`,
      description: `Explore amazing ${genre.toLowerCase()} anime series`,
      icon: '🎌',
      gradient: 'from-purple-600 via-blue-500 to-teal-500',
      bgGradient: 'from-purple-900/20 via-blue-900/10 to-teal-900/5'
    };
  };

  const genreInfo = getGenreInfo(genreName);

  const fetchGenreSeries = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/series?limit=1000`);
      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }
      
      const data = await response.json();
      
      // Filter series that contain anime with the selected genre
      const filteredSeries = data.series?.filter((s: Series) => {
        return s.animes.some(anime => {
          if (!anime.genres || !Array.isArray(anime.genres)) return false;
          
          return anime.genres.some((genreObj: any) => {
            const genreNameInData = genreObj?.genre?.name || genreObj?.name || genreObj;
            return genreNameInData?.toLowerCase() === genreName.toLowerCase();
          });
        });
      }) || [];
      
      setSeries(filteredSeries);
      
    } catch (err) {
      console.error('Error fetching genre series:', err);
      setError('Failed to load anime series. Please try again.');
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

  useEffect(() => {
    if (genreName) {
      fetchGenreSeries();
    }
  }, [genreName]);

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

  const sortedSeries = [...series].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        const aScore = Math.max(...a.animes.map(anime => anime.score || 0));
        const bScore = Math.max(...b.animes.map(anime => anime.score || 0));
        return bScore - aScore;
      case 'popularity':
        return b._count.animes - a._count.animes;
      case 'newest':
        const aYear = Math.max(...a.animes.map(anime => anime.year || 0));
        const bYear = Math.max(...b.animes.map(anime => anime.year || 0));
        return bYear - aYear;
      case 'oldest':
        const aYearOld = Math.min(...a.animes.map(anime => anime.year || 9999));
        const bYearOld = Math.min(...b.animes.map(anime => anime.year || 9999));
        return aYearOld - bYearOld;
      case 'episodes':
        const aEps = Math.max(...a.animes.map(anime => anime.episodes || 0));
        const bEps = Math.max(...b.animes.map(anime => anime.episodes || 0));
        return bEps - aEps;
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 text-gray-900'
    }`}>
      {/* Enhanced floating background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className={`backdrop-blur-xl rounded-3xl p-8 mb-12 bg-gradient-to-r ${genreInfo.bgGradient} border border-opacity-20 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className={`text-6xl bg-gradient-to-r ${genreInfo.gradient} bg-clip-text text-transparent`}>
                  {genreInfo.icon}
                </div>
                <div>
                  <h1 className={`text-4xl font-bold bg-gradient-to-r ${genreInfo.gradient} bg-clip-text text-transparent mb-2`}>
                    {genreInfo.title}
                  </h1>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-2xl`}>
                    {genreInfo.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => router.back()}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 gamer-card-hover ${
                  isDarkMode 
                    ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/50 border border-gray-700/30' 
                    : 'bg-white/60 text-gray-700 hover:bg-gray-100/50 border border-gray-200/30'
                }`}
              >
                ← Back to Discover
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 gamer-card-hover ${
                  isDarkMode 
                    ? 'bg-gray-800/60 text-gray-300 border border-gray-700/30' 
                    : 'bg-white/60 text-gray-700 border border-gray-200/30'
                }`}
              >
                <option value="rating">Top Rated</option>
                <option value="popularity">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="episodes">Most Episodes</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
            
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {series.length} series found
            </div>
          </div>

          {/* Loading State */}
          {(loading || !genreName) && (
            <div className="flex justify-center py-24">
              <div className={`text-center backdrop-blur-xl rounded-3xl p-10 max-w-md gamer-card-hover ${
                isDarkMode ? 'bg-gray-800/30 border border-gray-700/30' : 'bg-white/60 border border-gray-200/30'
              }`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Loading {genreName ? `${genreName.toLowerCase()} ` : ''}anime...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex justify-center py-24">
              <div className={`text-center backdrop-blur-xl rounded-3xl p-10 max-w-md gamer-card-hover ${
                isDarkMode ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50/60 border border-red-200/30'
              }`}>
                <p className={`text-2xl mb-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  ⚠️ {error}
                </p>
                <button
                  onClick={fetchGenreSeries}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium gamer-card-hover"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && genreName && series.length === 0 && (
            <div className="flex justify-center py-24">
              <div className={`text-center backdrop-blur-xl rounded-3xl p-10 max-w-md gamer-card-hover ${
                isDarkMode ? 'bg-gray-800/30 border border-gray-700/30' : 'bg-white/60 border border-gray-200/30'
              }`}>
                <p className={`text-2xl mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  📺 No {genreName.toLowerCase()} anime found
                </p>
                <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-700'}`}>
                  Try exploring other genres or check back later
                </p>
              </div>
            </div>
          )}

          {/* Series Grid */}
          {!loading && !error && genreName && sortedSeries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-8">
              {sortedSeries.map((series) => (
                <EnhancedSeriesCard
                  key={series.id}
                  series={series}
                  onOpenDetails={() => handleOpenDetails(series.id)}
                  onFavoriteToggle={() => toggleFavorite(series.id)}
                  onWatchlistToggle={() => addToWatchlist(series.id)}
                  isFavorite={isFavorite(series.id)}
                  isInWatchlist={isInWatchlist(series.id)}
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
        </div>
      </div>
    </div>
  );
};

export default GenrePage; 