'use client'

import { createClient } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/src/hooks/useDarkMode'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const { isDarkMode, mounted } = useDarkMode()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!mounted) {
    return (
      <div className="w-20 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
    )
  }

  return (
    <button
      onClick={handleLogout}
      className={`group relative font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-300 btn-animate ${
        isDarkMode
          ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
      }`}
    >
      <span>Sign Out</span>
      
      {/* Subtle hover effect */}
      <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-gray-600/20 to-gray-500/20'
          : 'bg-gradient-to-r from-gray-300/20 to-gray-400/20'
      }`} />
    </button>
  )
} 