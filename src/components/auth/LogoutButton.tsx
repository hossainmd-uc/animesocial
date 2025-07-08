'use client'

import { createClient } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="group relative bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-300 btn-animate"
    >
      <span>Sign Out</span>
      
      {/* Subtle hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-300/20 to-gray-400/20 dark:from-gray-600/20 dark:to-gray-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  )
} 