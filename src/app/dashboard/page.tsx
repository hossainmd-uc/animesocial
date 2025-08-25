import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/src/components/layout/Header'
import DashboardClient from '@/src/components/dashboard/DashboardClient'
import { ProfileService } from '@/src/lib/profile-service'
import { Profile } from '@/src/types/profile'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Ensure profile exists and get it with error handling
  let initialProfile: Profile;
  try {
    initialProfile = await ProfileService.ensureProfile(
      user.id,
      user.email || undefined,
      user.user_metadata
    )
  } catch (error) {
    console.error('Dashboard: Failed to get profile, using fallback:', error);
    // Create a fallback profile for UI purposes
    initialProfile = {
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
    <div className="gamer-gradient transition-colors duration-300 relative h-screen overflow-y-auto">
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
      
      {/* Stylized Vertical Dashboard Text */}
      <div className="dashboard-text">
        DASHBOARD
      </div>
      
      <Header />
      
      {/* Main Content Section */}
      <section className="container mx-auto px-6 relative z-10 py-10">
        <DashboardClient user={user} initialProfile={initialProfile} />
      </section>
    </div>
  )
} 