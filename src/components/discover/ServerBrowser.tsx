'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '@/src/hooks/useDarkMode';
import ServerJoinModal from './ServerJoinModal';
import { 
  MagnifyingGlassIcon, 
  ServerIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  HashtagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface Server {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  inviteCode: string;
  memberCount: number;
  postCount: number;
  channelCount: number;
  owner: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface ServerBrowserResponse {
  servers: Server[];
  totalCount: number;
  hasMore: boolean;
}

export default function ServerBrowser() {
  const { isDarkMode } = useDarkMode();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchServers = async (search: string = '', reset: boolean = true) => {
    try {
      setLoading(true);
      const offset = reset ? 0 : servers.length;
      const response = await fetch(
        `/api/discover/servers?search=${encodeURIComponent(search)}&limit=12&offset=${offset}`
      );
      
      if (response.ok) {
        const data: ServerBrowserResponse = await response.json();
        if (reset) {
          setServers(data.servers);
        } else {
          setServers(prev => [...prev, ...data.servers]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServers(searchTerm, true);
  };

  const loadMore = () => {
    fetchServers(searchTerm, false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleServerClick = (server: Server) => {
    setSelectedServer(server);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedServer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-3xl font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Discover Servers
        </h2>
        <p className={`text-lg ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Join public anime communities and connect with fellow fans
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className={`h-5 w-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search servers..."
            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              isDarkMode
                ? 'bg-slate-800 border-slate-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
      </form>

      {/* Servers Grid */}
      {loading && servers.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`p-6 rounded-lg border animate-pulse ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className={`w-16 h-16 rounded-lg mb-4 ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`} />
              <div className={`h-4 rounded mb-2 ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`} />
              <div className={`h-3 rounded mb-4 w-3/4 ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`} />
              <div className={`h-3 rounded w-1/2 ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <div
                key={server.id}
                onClick={() => handleServerClick(server)}
                className={`p-6 rounded-lg border transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Server Icon & Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                    isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
                  }`}>
                    {server.iconUrl ? (
                      <img
                        src={server.iconUrl}
                        alt={server.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <ServerIcon className={`w-8 h-8 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-bold truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {server.name}
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      by {server.owner.displayName || server.owner.username}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {server.description && (
                  <p className={`text-sm mb-4 line-clamp-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {server.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className={`flex items-center justify-center mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <UserGroupIcon className="w-4 h-4" />
                    </div>
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {server.memberCount}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      members
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`flex items-center justify-center mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <HashtagIcon className="w-4 h-4" />
                    </div>
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {server.channelCount}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      channels
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`flex items-center justify-center mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                    </div>
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {server.postCount}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      posts
                    </div>
                  </div>
                </div>

                {/* Created Date */}
                <div className={`flex items-center text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  Created {formatDate(server.createdAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                } disabled:opacity-50`}
              >
                {loading ? 'Loading...' : 'Load More Servers'}
              </button>
            </div>
          )}

          {servers.length === 0 && !loading && (
            <div className="text-center py-12">
              <ServerIcon className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className={`text-lg font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                No servers found
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Try adjusting your search terms or check back later.
              </p>
            </div>
          )}
        </>
      )}

      {/* Server Join Modal */}
      {selectedServer && (
        <ServerJoinModal
          server={selectedServer}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
