import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileCard from '@/src/components/profile/ProfileCard'
import Header from '@/src/components/layout/Header'
import FavoritesSection from '@/src/components/dashboard/FavoritesSection'
import RecentActivitySection from '@/src/components/dashboard/RecentActivitySection'
import AnimeStatsSection from '@/src/components/dashboard/AnimeStatsSection'
import GenreStatsSection from '@/src/components/dashboard/GenreStatsSection'
import { ProfileService } from '@/src/lib/profile-service'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Ensure profile exists and get it with error handling
  let profile: any;
  try {
    profile = await ProfileService.ensureProfile(
      user.id,
      user.email || undefined,
      user.user_metadata
    )
  } catch (error) {
    console.error('Dashboard: Failed to get profile, using fallback:', error);
    // Create a fallback profile for UI purposes
    profile = {
      id: user.id,
      username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
      displayName: user.user_metadata?.display_name || null,
      bio: null,
      favoriteAnime: null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      status: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  return (
    <div className="min-h-screen gamer-gradient transition-all duration-500">
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
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="content-wrapper section-padding py-10">
        {/* Top Row - Profile and Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
          {/* Profile Section - Larger on desktop */}
          <div className="xl:col-span-2">
            <ProfileCard user={user} profile={profile} />
          </div>
          
          {/* Statistics Section */}
          <div className="xl:col-span-2">
            <AnimeStatsSection />
          </div>
        </div>

        {/* Bottom Row - Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Favorites Section */}
          <div className="lg:col-span-1">
            <FavoritesSection />
          </div>
          
          {/* Genres Chart */}
          <div className="lg:col-span-1">
            <GenreStatsSection />
          </div>
            
          {/* Recent Activity Section */}
          <div className="lg:col-span-1">
            <RecentActivitySection />
          </div>
        </div>
      </div>
    </div>
  )
} 