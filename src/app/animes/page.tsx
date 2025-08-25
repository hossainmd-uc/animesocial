'use client'

import { useState, useEffect, useRef } from 'react';
import Header from '@/src/components/layout/Header';
import EnhancedSeriesCard from '@/src/components/EnhancedSeriesCard';
import SeriesDetailsModal from '@/src/components/SeriesDetailsModal';
import HorizontalScrollContainer from '@/src/components/common/HorizontalScrollContainer';
import PopularitySidebar from '@/src/components/PopularitySidebar';
import { useDarkMode } from '@/src/hooks/useDarkMode';
import { createClient } from '@/src/lib/supabase/client';
import { 
  HeartIcon, 
  StarIcon, 
  SparklesIcon, 
  PlayIcon 
} from '@heroicons/react/24/solid';

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
  const [user, setUser] = useState<any>(null);
  const [userAnimeList, setUserAnimeList] = useState<UserAnime[]>([]);
  const [hasSearchedBefore, setHasSearchedBefore] = useState(false);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('eternal-classics');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLElement>(null);
  const genreScrollRef = useRef<HTMLDivElement>(null);

  // Note: Category filtering is now handled by dedicated category pages

  // Available genre options - Only genres that exist in the database
  const baseGenreOptions = [
    'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Mystery', 'Romance', 'Sci-Fi', 'Sports'
  ];
  const extendedGenreOptions = [
    'Action', 'Award Winning', 'Supernatural', 'Suspense'
  ];
  
  const allGenreOptions = [...baseGenreOptions, ...extendedGenreOptions];
  const genreOptions = showAllGenres ? allGenreOptions : baseGenreOptions;

  // Section options for dropdown
  const sectionOptions = [
    { value: 'eternal-classics', label: 'Eternal Classics', description: 'Timeless anime that defined generations' },
    { value: 'mini-masterpieces', label: 'Mini Masterpieces', description: 'Short but impactful series' },
    { value: 'binge-worthy', label: 'Binge Worthy', description: 'Can\'t stop watching once you start' },
    { value: 'heartfelt-journeys', label: 'Heartfelt Journeys', description: 'Emotional stories that touch the soul' }
  ];

  // Scroll functions for desktop genre navigation
  const checkScrollButtons = () => {
    if (genreScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = genreScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollGenres = (direction: 'left' | 'right') => {
    if (genreScrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? genreScrollRef.current.scrollLeft - scrollAmount
        : genreScrollRef.current.scrollLeft + scrollAmount;
      
      genreScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Enhanced continuous hover auto-scroll with acceleration
  const hoverScrollAnimationRef = useRef<number | null>(null);
  const scrollStartTimeRef = useRef<number>(0);
  const startHoverAutoScroll = (direction: 'left' | 'right') => {
    // Cancel any existing animation
    if (hoverScrollAnimationRef.current !== null) {
      cancelAnimationFrame(hoverScrollAnimationRef.current);
      hoverScrollAnimationRef.current = null;
    }

    scrollStartTimeRef.current = performance.now();
    const baseSpeed = 40; // Base speed for immediate responsiveness
    const maxSpeed = 60; // Maximum speed after acceleration
    const accelerationTime = 800; // Time to reach max speed (ms)
    
    const animate = () => {
      const container = genreScrollRef.current;
      if (!container) return;

      // Calculate acceleration based on time
      const elapsed = performance.now() - scrollStartTimeRef.current;
      const accelerationProgress = Math.min(elapsed / accelerationTime, 1);
      
      // Ease-out acceleration curve for smooth feel
      const easeOutQuad = 1 - Math.pow(1 - accelerationProgress, 2);
      const currentSpeed = baseSpeed + (maxSpeed - baseSpeed) * easeOutQuad;

      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (direction === 'left') {
        container.scrollLeft = Math.max(0, container.scrollLeft - currentSpeed);
      } else {
        container.scrollLeft = Math.min(maxScrollLeft, container.scrollLeft + currentSpeed);
      }

      // Keep button visibility states in sync
      checkScrollButtons();

      // Stop when we've reached the ends
      const atStart = container.scrollLeft <= 0;
      const atEnd = container.scrollLeft >= maxScrollLeft - 1;
      const shouldStop = (direction === 'left' && atStart) || (direction === 'right' && atEnd);
      if (shouldStop) {
        hoverScrollAnimationRef.current = null;
        return;
      }

      hoverScrollAnimationRef.current = requestAnimationFrame(animate);
    };

    hoverScrollAnimationRef.current = requestAnimationFrame(animate);
  };

  const stopHoverAutoScroll = () => {
    if (hoverScrollAnimationRef.current !== null) {
      cancelAnimationFrame(hoverScrollAnimationRef.current);
      hoverScrollAnimationRef.current = null;
    }
  };

  // Check scroll state when component mounts and on resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(checkScrollButtons, 100); // Small delay to ensure layout is complete
      setIsMobile(window.innerWidth < 640); // 640px is Tailwind's sm breakpoint
    };
    const scrollContainer = genreScrollRef.current;
    
    // Initial check
    setIsMobile(window.innerWidth < 640);
    
    if (scrollContainer) {
      // Initial check with delay to ensure content is rendered
      setTimeout(checkScrollButtons, 100);
      scrollContainer.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', handleResize);
      
      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Also check when genres change
  useEffect(() => {
    setTimeout(checkScrollButtons, 100);
  }, [showAllGenres]);

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
    // Clear any existing typing timer
    if (typingTimer) {
      clearTimeout(typingTimer);
    }

    // Debounced search
    const timer = setTimeout(() => {
      fetchSeries();
      
      // Trigger scroll to content when search results load
      if (searchQuery && searchQuery.trim().length > 0) {
        setHasSearchedBefore(true);
        scrollToContent();
      }
    }, 300);

    // Set up inactivity timer for scroll transition
    if (searchQuery && searchQuery.trim().length > 0) {
      const inactivityTimer = setTimeout(() => {
        if (!hasSearchedBefore) {
          scrollToContent();
          setHasSearchedBefore(true);
        }
      }, 2000); // 2 seconds of inactivity
      
      setTypingTimer(inactivityTimer);
    }

    return () => {
      clearTimeout(timer);
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [searchQuery]);



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
      
      // Note: Genre filtering is now handled by dedicated genre pages
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

  const handleGenreFilter = (genre: string) => {
    // Set the selected genre for visual feedback
    setSelectedGenre(genre);
    
    // Add a slight delay for the animation to be visible before navigation
    setTimeout(() => {
      window.location.href = `/discover/genre/${encodeURIComponent(genre.toLowerCase())}`;
    }, 200);
  };

  // Enhanced scroll to content section function
  const scrollToContent = () => {
    const container = containerRef.current;
    const contentEl = contentSectionRef.current;
    if (container && contentEl) {
      const cRect = container.getBoundingClientRect();
      const sRect = contentEl.getBoundingClientRect();
      const targetTop = sRect.top - cRect.top + container.scrollTop;
      
      // Use custom smooth scroll for consistent behavior
      const startTop = container.scrollTop;
      const distance = targetTop - startTop;
      const duration = 800;
      const startTime = performance.now();

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeOutCubic(progress);
        
        container.scrollTop = startTop + (distance * easeProgress);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    }
  };

  // Enhanced scroll back to hero section function
  const scrollToHero = () => {
    const container = containerRef.current;
    if (container) {
      const startTop = container.scrollTop;
      const distance = -startTop;
      const duration = 600;
      const startTime = performance.now();

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeOutCubic(progress);
        
        container.scrollTop = startTop + (distance * easeProgress);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setHasSearchedBefore(false);
    // Scroll back to hero when clearing search
    scrollToHero();
  };

  // Categorize series into themed sections
  const getSectionData = (section: string): Series[] => {
    switch (section) {
      case 'eternal-classics':
        return series.filter(s => s.averageScore && s.averageScore >= 8.0);
      case 'heartfelt-journeys':
        return series.filter(s => s.averageScore && s.averageScore >= 7.5 && s.averageScore < 8.0);
      case 'mini-masterpieces':
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
      case 'binge-worthy':
        return series.filter(s => {
          // Include series that have any long content (>12 episodes)
          const hasLongContent = s.animes.some(a => a.episodes && a.episodes > 12);
          return hasLongContent;
        });
      default:
        return [];
    }
  };

  const getPaginatedData = () => {
    const sectionData = getSectionData(selectedSection);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sectionData.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const sectionData = getSectionData(selectedSection);
    return Math.ceil(sectionData.length / itemsPerPage);
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    setCurrentPage(1); // Reset to first page when changing sections
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle category browse - navigate to dedicated category page
  const handleCategoryBrowse = (category: string) => {
    // Navigate to the dedicated category page
    window.location.href = `/discover/${category}`;
  };

  // Handle search input changes with auto-scroll triggers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Trigger scroll transition when user types 3+ characters
    if (value.trim().length >= 3 && !hasSearchedBefore) {
      scrollToContent();
      setHasSearchedBefore(true);
    }
    
    // Reset search state when clearing search
    if (value.trim().length === 0 && hasSearchedBefore) {
      setHasSearchedBefore(false);
      scrollToHero();
    }
  };

  // Handle Enter key press
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim().length > 0) {
        scrollToContent();
        setHasSearchedBefore(true);
      }
    }
  };

  // Handle search input focus (first time)
  const handleSearchFocus = () => {
    if (!hasSearchedBefore && searchQuery.trim().length === 0) {
      // Small delay to let user start typing before auto-scrolling
      setTimeout(() => {
        if (searchQuery.trim().length > 0) {
          scrollToContent();
          setHasSearchedBefore(true);
        }
      }, 1000);
    }
  };

  // Note: Category filtering functionality moved to dedicated category pages

  if (!mounted) {
    return null;
  }

  return (
    <div className={`gamer-gradient transition-colors duration-300 relative h-screen overflow-y-auto`} ref={containerRef}>


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
      
      {/* Hero Section */}
      <section className="content-wrapper relative z-10">
        <div className="py-16 text-center relative section-padding">
          <div className="relative mb-6">
            <h1 className={`text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight`}>
            Discover Anime
          </h1>
            <div className={`absolute -inset-1 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 blur-3xl -z-10 ${
              isDarkMode ? 'opacity-40' : 'opacity-20'
            }`}></div>
          </div>

          {/* Creative Genre Selector */}
          <div className="max-w-5xl mx-auto mb-8">
            {/* Mobile: Minimal Genre Cards */}
            <div className="sm:hidden">
              <div className="grid grid-cols-2 gap-2.5">
                {genreOptions.map((genre, index) => (
                  <button
                    key={genre}
                    onClick={() => handleGenreFilter(genre)}
                    className={`group relative p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                      selectedGenre === genre
                        ? isDarkMode
                          ? 'bg-slate-700 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20'
                          : 'bg-white border-2 border-purple-400/50 shadow-lg shadow-purple-500/20'
                        : isDarkMode
                          ? 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/70 hover:border-slate-600'
                          : 'bg-white/70 border border-slate-200/50 hover:bg-white/90 hover:border-slate-300'
                    } backdrop-blur-sm`}
                  >
                    {/* Minimal accent */}
                    {selectedGenre === genre && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full"></div>
                    )}
                    
                    {/* Genre text */}
                    <div className="text-center">
                      <span className={`font-medium text-sm ${
                        selectedGenre === genre
                          ? isDarkMode ? 'text-purple-300' : 'text-purple-600'
                          : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {genre}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Show More/Less Button */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllGenres(!showAllGenres)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                  }`}
                >
                  {showAllGenres ? 'Show Less' : `Show More (${extendedGenreOptions.length})`}
                </button>
              </div>
            </div>

            {/* Desktop: Minimal Scrollable Container */}
            <div className="hidden sm:block">
              <div className="relative group">
                <div className={`relative p-2 rounded-2xl backdrop-blur-md border ${
                  isDarkMode 
                    ? 'bg-slate-900/60 border-slate-700/50' 
                    : 'bg-white/70 border-slate-200/50'
                } shadow-xl overflow-hidden`}>
                  
                  {/* Left fade gradient (wider for clearer affordance) */}
                  {canScrollLeft && (
                    <div className={`absolute left-0 top-0 bottom-0 w-24 md:w-28 z-10 pointer-events-none bg-gradient-to-r ${
                      isDarkMode 
                        ? 'from-slate-900 via-slate-900/80 to-transparent' 
                        : 'from-white via-white/90 to-transparent'
                    }`}></div>
                  )}
                  
                  {/* Right fade gradient (wider for clearer affordance) */}
                  {canScrollRight && (
                    <div className={`absolute right-0 top-0 bottom-0 w-24 md:w-28 z-10 pointer-events-none bg-gradient-to-l ${
                      isDarkMode 
                        ? 'from-slate-900 via-slate-900/80 to-transparent' 
                        : 'from-white via-white/90 to-transparent'
                    }`}></div>
                  )}

                  {/* Hover scroll zones */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-28 md:w-32 z-20"
                    onMouseEnter={() => {
                      if (canScrollLeft) {
                        startHoverAutoScroll('left');
                      }
                    }}
                    onMouseLeave={stopHoverAutoScroll}
                    style={{ cursor: canScrollLeft ? 'pointer' : 'default' }}
                  ></div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-28 md:w-32 z-20"
                    onMouseEnter={() => {
                      if (canScrollRight) {
                        startHoverAutoScroll('right');
                      }
                    }}
                    onMouseLeave={stopHoverAutoScroll}
                    style={{ cursor: canScrollRight ? 'pointer' : 'default' }}
                  ></div>
                  
                  {/* Scrollable genre buttons */}
                  <div 
                    ref={genreScrollRef}
                    className="flex gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden px-2"
                    style={{ 
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none'
                    }}
                  >
                    {allGenreOptions.map((genre, index) => (
                      <button
                        key={genre}
                        onClick={() => handleGenreFilter(genre)}
                        className={`relative flex-shrink-0 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap ${
                          selectedGenre === genre
                            ? isDarkMode
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-purple-600 text-white shadow-lg'
                            : isDarkMode
                              ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/50'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search anime series..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={handleSearchFocus}
                className={`w-full px-8 py-4 rounded-2xl text-base md:text-lg focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-xl container-floating ${
                  isDarkMode
                    ? 'bg-gray-800/70 text-white focus:ring-purple-400/50 focus:border-purple-400 placeholder-gray-400'
                    : 'bg-white/80 text-gray-900 focus:ring-purple-500/50 focus:border-purple-500 placeholder-gray-500'
                } border-0 shadow-lg`}
              />
              
              {/* Search Icon */}
              <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content with Sidebar Layout */}
      <div className="content-wrapper relative z-10">
        <div className="xl:grid xl:grid-cols-[1fr_320px] xl:gap-8 xl:items-start section-padding">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Content Sections */}
            <section ref={contentSectionRef} className={`relative z-10 ${searchQuery ? 'py-2' : 'py-8'}`}>
        {/* Conditional Rendering: Search Results vs Browse Sections */}
        {searchQuery ? (
          <div>
            {/* Compact Search Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className={`text-lg font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {loading ? 'Searching...' : `Search results for: "${searchQuery}" (${series.length} found)`}
              </p>
              <button
                onClick={clearFilters}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
                }`}
              >
                Clear
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600/30 border-t-purple-600 mr-3"></div>
                <p className={`text-base ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Searching...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex justify-center py-8">
                <div className={`text-center rounded-xl p-6 max-w-md ${
                  isDarkMode ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50/60 border border-red-200/30'
                }`}>
                  <p className={`text-lg mb-4 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>⚠️ {error}</p>
                  <button
                    onClick={() => fetchSeries()}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && series.length === 0 && (
              <div className="text-center py-12">
                <p className={`text-lg mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>📺 No anime found</p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-700'
                }`}>Try a different search term</p>
              </div>
            )}

            {/* Search Results Grid */}
            {!loading && !error && series.length > 0 && (
              <div className="grid gap-4 max-w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
                {series.map((seriesItem: Series) => (
                  <div key={seriesItem.id} className="gamer-card-hover will-change-auto">
                    <EnhancedSeriesCard
                      series={seriesItem}
                      onOpenDetails={handleOpenDetails}
                      onFavoriteToggle={() => toggleFavorite(seriesItem.id)}
                      onWatchlistToggle={() => addToWatchlist(seriesItem.id)}
                      isFavorite={isFavorite(seriesItem.id)}
                      isInWatchlist={isInWatchlist(seriesItem.id)}
                      hideStats={isMobile}
                      isMobile={isMobile}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>


            {/* Loading State */}
            {loading && (
              <div className="flex flex-col justify-center items-center py-24">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600/30 border-t-purple-600 mb-6"></div>
                <p className={`text-lg font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Discovering amazing anime...</p>
              </div>
            )}

            {/* Error State */}
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

            {/* No Results */}
            {!loading && !error && series.length === 0 && (
              <div className="flex justify-center py-24">
                <div className={`text-center backdrop-blur-xl rounded-3xl p-10 max-w-md gamer-card-hover ${
                  isDarkMode ? 'bg-gray-800/30 border border-gray-700/30' : 'bg-white/60 border border-gray-200/30'
                }`}>
                  <p className={`text-2xl mb-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>📺 No series found</p>
                </div>
              </div>
            )}

            {/* Section Selector and Content */}
            {!loading && !error && series.length > 0 && (
              <div className="max-w-full">
                {/* Category Selection Container */}
                <div className="mb-4">
                  <div className={`relative rounded-lg backdrop-blur-md border ${
                    isDarkMode 
                      ? 'bg-gray-800/20 border-gray-700/10' 
                      : 'bg-white/30 border-gray-200/10'
                  } shadow-sm overflow-hidden`}>
                    {/* Sliding Selection Indicator - Mobile (2 columns) */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300 ease-out lg:hidden"
                      style={{
                        width: `50%`,
                        left: `${sectionOptions.findIndex(opt => opt.value === selectedSection) % 2 * 50}%`,
                        top: `${Math.floor(sectionOptions.findIndex(opt => opt.value === selectedSection) / 2) * 50}%`,
                        height: `50%`,
                      }}
                    />
                    
                    {/* Sliding Selection Indicator - Desktop (4 columns) */}
                    <div 
                      className="absolute inset-y-0 bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300 ease-out hidden lg:block"
                      style={{
                        width: `25%`,
                        left: `${sectionOptions.findIndex(opt => opt.value === selectedSection) * 25}%`,
                      }}
                    />
                    
                    {/* Category Buttons */}
                    <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4">
                      {sectionOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSectionChange(option.value)}
                          className={`relative px-1 py-2 text-center transition-all duration-300 ${
                            selectedSection === option.value
                              ? 'text-white'
                              : isDarkMode
                                ? 'text-gray-400 hover:text-white'
                                : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <div className="font-medium text-xs sm:text-sm">
                            {option.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid Display */}
                <div className="grid gap-6 mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5" key={selectedSection}>
                  {getPaginatedData().map((seriesItem: Series, index) => (
                    <div key={seriesItem.id} className="gamer-card-hover will-change-auto animate-in fade-in duration-500" style={{
                      animationDelay: `${index * 50}ms`
                    }}>
                      <EnhancedSeriesCard
                        series={seriesItem}
                        onOpenDetails={handleOpenDetails}
                        onFavoriteToggle={() => toggleFavorite(seriesItem.id)}
                        onWatchlistToggle={() => addToWatchlist(seriesItem.id)}
                        isFavorite={isFavorite(seriesItem.id)}
                        isInWatchlist={isInWatchlist(seriesItem.id)}
                        hideStats={isMobile}
                        isMobile={isMobile}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {getTotalPages() > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-12 animate-in fade-in duration-500" style={{
                    animationDelay: '0.3s'
                  }}>
                    {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-11 h-11 rounded-lg font-semibold transition-all duration-300 backdrop-blur-xl ${
                          page === currentPage
                            ? 'bg-purple-600 text-white shadow-lg hover:bg-purple-700 transform hover:scale-105'
                            : isDarkMode
                              ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80 border border-slate-600/30'
                              : 'bg-white/50 text-gray-700 hover:bg-white/70 border border-slate-300/30'
                        } hover:shadow-xl`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
          </section>
        </div>

          {/* Desktop Sidebar - Now properly integrated in grid */}
          <div className="hidden xl:block sticky top-6 h-fit">
            <PopularitySidebar />
          </div>
        </div>
      </div>

      {/* Medium & Mobile Sidebar - Shows after all content */}
      <div className="xl:hidden content-wrapper mt-8 relative z-10">
        <div className="section-padding">
          <PopularitySidebar isHorizontal={true} />
        </div>
      </div>

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