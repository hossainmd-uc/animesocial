import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">🎌 Anime Social Hub</h1>
            <p className="text-xl mb-8">Connect with fellow anime fans</p>
            <div className="space-y-4">
              <div className="text-left bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-2">
                <p>📺 Track your anime journey</p>
                <p>👥 Find your taste tribe</p>
                <p>🎭 Join episode discussions</p>
                <p>🔍 Discover new favorites</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Link
              href="/auth/signup"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              Get Started
            </Link>
            
            <Link
              href="/auth/login"
              className="group relative w-full flex justify-center py-3 px-4 border border-white text-sm font-medium rounded-md text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
