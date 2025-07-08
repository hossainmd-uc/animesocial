import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileCard from '@/src/components/profile/ProfileCard'
import Header from '@/src/components/layout/Header'
import FavoritesSection from '@/src/components/dashboard/FavoritesSection'
import RecentActivitySection from '@/src/components/dashboard/RecentActivitySection'
import { ProfileService } from '@/src/lib/profile-service'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Ensure profile exists and get it
  const profile = await ProfileService.ensureProfile(
    user.id,
    user.email || undefined,
    user.user_metadata
  )

  return (
    <div className="min-h-screen smooth-gradient transition-all duration-500">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="content-wrapper section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <ProfileCard user={user} profile={profile} />
          </div>
          
          {/* Favorites Section */}
          <div className="lg:col-span-1">
            <FavoritesSection />
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