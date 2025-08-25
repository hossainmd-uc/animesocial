'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '@/src/hooks/useDarkMode';
import Link from 'next/link';
import Avatar from '@/src/components/ui/Avatar';
import { 
  MagnifyingGlassIcon, 
  UserIcon,
  CalendarIcon,
  BookOpenIcon,
  ChatBubbleLeftEllipsisIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  status: string | null;
  createdAt: string;
  _count: {
    animeList: number;
    serverPosts: number;
    ownedServers: number;
  };
}

interface UserSearchResponse {
  users: User[];
  totalCount: number;
  hasMore: boolean;
}

export default function UserSearch() {
  const { isDarkMode } = useDarkMode();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const fetchUsers = async (search: string = '', reset: boolean = true) => {
    try {
      setLoading(true);
      const offset = reset ? 0 : users.length;
      const response = await fetch(
        `/api/discover/users?search=${encodeURIComponent(search)}&limit=12&offset=${offset}`
      );
      
      if (response.ok) {
        const data: UserSearchResponse = await response.json();
        if (reset) {
          setUsers(data.users);
        } else {
          setUsers(prev => [...prev, ...data.users]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchTerm, true);
  };

  const loadMore = () => {
    fetchUsers(searchTerm, false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-3xl font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Discover Users
        </h2>
        <p className={`text-lg ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Find and connect with anime enthusiasts
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
            placeholder="Search users by username, display name, or bio..."
            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              isDarkMode
                ? 'bg-slate-800 border-slate-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
      </form>

      {/* Users Grid */}
      {loading && users.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`p-6 rounded-lg border animate-pulse ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className={`w-16 h-16 rounded-full mb-4 ${
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
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/discover/${user.username}`}
                className={`block p-6 rounded-lg border transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Avatar & Name */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar 
                    src={user.avatarUrl} 
                    username={user.username} 
                    size="lg" 
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-bold truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user.displayName || user.username}
                    </h3>
                    {user.displayName && (
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        @{user.username}
                      </p>
                    )}
                    {user.status && (
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {user.status}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className={`text-sm mb-4 line-clamp-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {user.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className={`flex items-center justify-center mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <BookOpenIcon className="w-4 h-4" />
                    </div>
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user._count.animeList}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      anime
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`flex items-center justify-center mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                    </div>
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user._count.serverPosts}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      posts
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`flex items-center justify-center mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <ServerIcon className="w-4 h-4" />
                    </div>
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user._count.ownedServers}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      servers
                    </div>
                  </div>
                </div>

                {/* Join Date */}
                <div className={`flex items-center text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  Joined {formatDate(user.createdAt)}
                </div>
              </Link>
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
                {loading ? 'Loading...' : 'Load More Users'}
              </button>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <UserIcon className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className={`text-lg font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                No users found
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
    </div>
  );
}
