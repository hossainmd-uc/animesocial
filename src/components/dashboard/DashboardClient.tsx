'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import ProfileCard from '@/src/components/profile/ProfileCard';
import AnimeStatsSection from '@/src/components/dashboard/AnimeStatsSection';
import RecentActivitySection from '@/src/components/dashboard/RecentActivitySection';
import FavoritesSection from '@/src/components/dashboard/FavoritesSection';
import GenreStatsSection from '@/src/components/dashboard/GenreStatsSection';
import { Profile } from '@/src/types/profile';

interface DashboardClientProps {
  user: User;
  initialProfile: Profile;
}

export default function DashboardClient({ user, initialProfile }: DashboardClientProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  return (
    <>
      {/* Top Row - Profile, Stats, and Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 mb-8">
        {/* Profile Section */}
        <div className="xl:col-span-2">
          <ProfileCard 
            user={user} 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate}
          />
        </div>
        
        {/* Statistics Section */}
        <div className="xl:col-span-2">
          <AnimeStatsSection />
        </div>

        {/* Recent Activity Section */}
        <div className="xl:col-span-2">
          <RecentActivitySection />
        </div>
      </div>

      {/* Bottom Row - Favorites and Genres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorites Section */}
        <div className="lg:col-span-1">
          <FavoritesSection />
        </div>
        
        {/* Genres Chart */}
        <div className="lg:col-span-1">
          <GenreStatsSection />
        </div>
      </div>
    </>
  );
}
