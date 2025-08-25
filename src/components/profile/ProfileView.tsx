'use client';

import { useDarkMode } from '@/src/hooks/useDarkMode';
import ProfileViewCard from './ProfileViewCard';
import ProfileViewAnimeStats from './ProfileViewAnimeStats';
import ProfileViewRecentActivity from './ProfileViewRecentActivity';
import ProfileViewFavorites from './ProfileViewFavorites';
import ProfileViewGenreStats from './ProfileViewGenreStats';

interface ProfileViewProps {
  profileData: {
    id: string;
    username: string;
    displayName?: string | null;
    bio?: string | null;
    favoriteAnime?: string | null;
    avatarUrl?: string | null;
    status?: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
      serverPosts: number;
      serverMessages: number;
      postLikes: number;
      messageLikes: number;
      animeList: number;
    };
    animeList: Array<{
      status: string;
      score?: number | null;
      anime: {
        title: string;
        imageUrl?: string | null;
      };
    }>;
  };
}

export default function ProfileView({ profileData }: ProfileViewProps) {
  const { mounted } = useDarkMode();

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 mb-8">
          <div className="xl:col-span-2 h-96 bg-gray-200 rounded"></div>
          <div className="xl:col-span-2 h-96 bg-gray-200 rounded"></div>
          <div className="xl:col-span-2 h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Row - Profile, Stats, and Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 mb-8">
        {/* Profile Section */}
        <div className="xl:col-span-2">
          <ProfileViewCard profileData={profileData} />
        </div>
        
        {/* Statistics Section */}
        <div className="xl:col-span-2">
          <ProfileViewAnimeStats username={profileData.username} />
        </div>

        {/* Recent Activity Section */}
        <div className="xl:col-span-2">
          <ProfileViewRecentActivity username={profileData.username} />
        </div>
      </div>

      {/* Bottom Row - Favorites and Genres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorites Section */}
        <div className="lg:col-span-1">
          <ProfileViewFavorites username={profileData.username} />
        </div>
        
        {/* Genres Chart */}
        <div className="lg:col-span-1">
          <ProfileViewGenreStats username={profileData.username} />
        </div>
      </div>
    </>
  );
}
