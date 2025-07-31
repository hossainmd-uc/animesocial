'use client'

import { useState, useEffect } from 'react';
import { useDarkMode } from '@/src/hooks/useDarkMode';

interface AnimeDetails {
  id: string;
  title: string;
  titleEnglish?: string;
  synopsis?: string;
  status: string;
  episodes?: number;
  score?: number;
  year?: number;
  type: string;
  seriesType?: string;
  seriesOrder?: number;
  imageUrl: string;
  trailerUrl?: string;
  genres: Array<{ id: string; name: string }>;
  streaming: Array<{ name: string; url: string }>;
  externalLinks: Array<{ name: string; url: string }>;
}

interface SeriesDetails {
  id: string;
  title: string;
  titleEnglish?: string;
  titleJapanese?: string;
  description?: string;
  imageUrl?: string;
  status: string;
  startYear?: number;
  endYear?: number;
  totalEpisodes?: number;
  averageScore?: number;
  popularity?: number;
  animes: AnimeDetails[];
}

interface SeriesDetailsModalProps {
  seriesId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SeriesDetailsModal({ seriesId, isOpen, onClose }: SeriesDetailsModalProps) {
  const { isDarkMode } = useDarkMode();
  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAnime, setExpandedAnime] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && seriesId) {
      fetchSeriesDetails();
    }
  }, [isOpen, seriesId]);

  const fetchSeriesDetails = async () => {
    if (!seriesId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/series/${seriesId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch series details');
      }
      const data = await response.json();
      setSeries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const organizeAnimeByType = (animes: AnimeDetails[]) => {
    const organized = {
      main: animes.filter(a => a.seriesType === 'main'),
      sequels: animes.filter(a => a.seriesType === 'sequel'),
      movies: animes.filter(a => a.seriesType === 'movie'),
      ovas: animes.filter(a => a.seriesType === 'ova'),
      specials: animes.filter(a => a.seriesType === 'special'),
      others: animes.filter(a => !['main', 'sequel', 'movie', 'ova', 'special'].includes(a.seriesType || ''))
    };
    
    // Sort each category by series order
    Object.keys(organized).forEach(key => {
      organized[key as keyof typeof organized].sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
    });
    
    return organized;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TV': return '📺';
      case 'Movie': return '🎬';
      case 'OVA': return '💿';
      case 'Special': return '⭐';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Finished Airing': return 'text-green-500';
      case 'Currently Airing': return 'text-blue-500';
      case 'Not yet aired': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-4xl max-h-[90vh] w-full rounded-lg shadow-xl overflow-hidden ${
        isDarkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Series Details
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4 text-red-500 text-center">
              Error: {error}
            </div>
          )}

          {series && (
            <div className="p-6">
              {/* Series Header */}
              <div className="flex gap-6 mb-8">
                <img
                  src={series.imageUrl || series.animes[0]?.imageUrl || '/placeholder-anime.jpg'}
                  alt={series.title}
                  className="w-48 h-64 object-cover rounded-lg shadow-lg"
                />
                
                <div className="flex-1">
                  <h1 className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {series.title}
                  </h1>
                  
                  {series.titleEnglish && series.titleEnglish !== series.title && (
                    <h2 className={`text-xl mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {series.titleEnglish}
                    </h2>
                  )}

                  {series.titleJapanese && (
                    <p className={`text-lg mb-3 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {series.titleJapanese}
                    </p>
                  )}

                  {/* Series Stats */}
                  <div className={`grid grid-cols-2 gap-4 mb-4 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <div>
                      <span className="font-semibold">Status:</span>
                      <span className={`ml-2 capitalize ${getStatusColor(series.status)}`}>
                        {series.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Episodes:</span>
                      <span className="ml-2">{series.totalEpisodes || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Years:</span>
                      <span className="ml-2">
                        {series.startYear}{series.endYear && series.endYear !== series.startYear ? `-${series.endYear}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Average Score:</span>
                      <span className="ml-2">⭐ {series.averageScore?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {series.description && (
                    <p className={`leading-relaxed ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {series.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Anime Entries */}
              <div>
                <h3 className={`text-2xl font-bold mb-4 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  Anime Entries ({series.animes.length})
                </h3>

                {(() => {
                  const organized = organizeAnimeByType(series.animes);
                  
                  return (
                    <div className="space-y-6">
                      {/* Main Series */}
                      {organized.main.length > 0 && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-3 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            📺 Main Series
                          </h4>
                          <div className="space-y-2">
                            {organized.main.map(anime => (
                              <AnimeEntryCard
                                key={anime.id}
                                anime={anime}
                                isDarkMode={isDarkMode}
                                expanded={expandedAnime === anime.id}
                                onToggleExpand={() => setExpandedAnime(
                                  expandedAnime === anime.id ? null : anime.id
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sequels */}
                      {organized.sequels.length > 0 && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-3 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            📺 Sequels & Seasons
                          </h4>
                          <div className="space-y-2">
                            {organized.sequels.map(anime => (
                              <AnimeEntryCard
                                key={anime.id}
                                anime={anime}
                                isDarkMode={isDarkMode}
                                expanded={expandedAnime === anime.id}
                                onToggleExpand={() => setExpandedAnime(
                                  expandedAnime === anime.id ? null : anime.id
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Movies */}
                      {organized.movies.length > 0 && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-3 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            🎬 Movies
                          </h4>
                          <div className="space-y-2">
                            {organized.movies.map(anime => (
                              <AnimeEntryCard
                                key={anime.id}
                                anime={anime}
                                isDarkMode={isDarkMode}
                                expanded={expandedAnime === anime.id}
                                onToggleExpand={() => setExpandedAnime(
                                  expandedAnime === anime.id ? null : anime.id
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* OVAs */}
                      {organized.ovas.length > 0 && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-3 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            💿 OVAs
                          </h4>
                          <div className="space-y-2">
                            {organized.ovas.map(anime => (
                              <AnimeEntryCard
                                key={anime.id}
                                anime={anime}
                                isDarkMode={isDarkMode}
                                expanded={expandedAnime === anime.id}
                                onToggleExpand={() => setExpandedAnime(
                                  expandedAnime === anime.id ? null : anime.id
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Specials */}
                      {organized.specials.length > 0 && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-3 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            ⭐ Specials
                          </h4>
                          <div className="space-y-2">
                            {organized.specials.map(anime => (
                              <AnimeEntryCard
                                key={anime.id}
                                anime={anime}
                                isDarkMode={isDarkMode}
                                expanded={expandedAnime === anime.id}
                                onToggleExpand={() => setExpandedAnime(
                                  expandedAnime === anime.id ? null : anime.id
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Others */}
                      {organized.others.length > 0 && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-3 ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            📱 Other Entries
                          </h4>
                          <div className="space-y-2">
                            {organized.others.map(anime => (
                              <AnimeEntryCard
                                key={anime.id}
                                anime={anime}
                                isDarkMode={isDarkMode}
                                expanded={expandedAnime === anime.id}
                                onToggleExpand={() => setExpandedAnime(
                                  expandedAnime === anime.id ? null : anime.id
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Individual Anime Entry Card Component
interface AnimeEntryCardProps {
  anime: AnimeDetails;
  isDarkMode: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}

function AnimeEntryCard({ anime, isDarkMode, expanded, onToggleExpand }: AnimeEntryCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TV': return '📺';
      case 'Movie': return '🎬';
      case 'OVA': return '💿';
      case 'Special': return '⭐';
      default: return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Finished Airing': return 'text-green-500';
      case 'Currently Airing': return 'text-blue-500';
      case 'Not yet aired': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`rounded-lg border transition-all duration-200 ${
      isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-gray-200 bg-gray-50'
    }`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h5 className={`font-semibold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {anime.title}
            </h5>
            <div className={`flex items-center gap-3 mt-1 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span>{getTypeIcon(anime.type)} {anime.type}</span>
              {anime.episodes && <span>• {anime.episodes} episodes</span>}
              {anime.year && <span>• {anime.year}</span>}
              {anime.score && <span>• ⭐ {anime.score}</span>}
              <span className={`capitalize ${getStatusColor(anime.status)}`}>
                • {anime.status}
              </span>
            </div>
          </div>
          
          <button
            onClick={onToggleExpand}
            className={`p-2 rounded transition-colors ${
              isDarkMode ? 'hover:bg-slate-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className={`px-4 pb-4 border-t ${
          isDarkMode ? 'border-slate-600' : 'border-gray-200'
        }`}>
          <div className="pt-4 space-y-4">
            {/* Synopsis */}
            {anime.synopsis && (
              <div>
                <h6 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Synopsis
                </h6>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {anime.synopsis}
                </p>
              </div>
            )}

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div>
                <h6 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Genres
                </h6>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map(genre => (
                    <span
                      key={genre.id}
                      className={`px-2 py-1 rounded text-xs ${
                        isDarkMode ? 'bg-slate-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Streaming & Links */}
            <div className="flex gap-4">
              {/* Streaming */}
              {anime.streaming && anime.streaming.length > 0 && (
                <div className="flex-1">
                  <h6 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Streaming
                  </h6>
                  <div className="space-y-1">
                    {anime.streaming.map((stream, index) => (
                      <a
                        key={index}
                        href={stream.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block text-sm hover:underline ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}
                      >
                        📺 {stream.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              {anime.externalLinks && anime.externalLinks.length > 0 && (
                <div className="flex-1">
                  <h6 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Links
                  </h6>
                  <div className="space-y-1">
                    {anime.externalLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block text-sm hover:underline ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`}
                      >
                        🔗 {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trailer */}
            {anime.trailerUrl && (
              <div>
                <a
                  href={anime.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  ▶️ Watch Trailer
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 