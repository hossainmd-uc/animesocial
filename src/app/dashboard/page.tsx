import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileCard from '@/components/profile/ProfileCard'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Your Anime Hub
            </h1>
            <LogoutButton />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Section */}
            <div className="md:col-span-1">
              <ProfileCard user={user} profile={profile} />
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-2">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Your Anime Journey Starts Here
                  </h2>
                  <div className="text-gray-600 space-y-3">
                    <p>🎌 Track your favorite anime series</p>
                    <p>📺 Log episodes as you watch them</p>
                    <p>👥 Connect with fellow anime fans</p>
                    <p>🔍 Discover new anime based on your taste</p>
                  </div>
                  
                  <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Coming Soon:</strong> Anime database integration, 
                      taste-matching algorithm, and community features!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 