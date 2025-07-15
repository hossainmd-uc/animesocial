'use client'

import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
    )
  }

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gray-100/80 dark:bg-slate-700/80 hover:bg-gray-200/80 dark:hover:bg-slate-600/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-800 group border border-gray-200/40 dark:border-slate-600/40"
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 dark:from-blue-400 dark:to-purple-500 dark:group-hover:opacity-30 transition-opacity duration-300" />
      
      {/* Sun Icon */}
      <SunIcon 
        className={`absolute w-6 h-6 text-yellow-500 transition-all duration-500 ${
          resolvedTheme === 'light' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-180 scale-75'
        }`}
      />
      
      {/* Moon Icon */}
      <MoonIcon 
        className={`absolute w-6 h-6 text-blue-400 transition-all duration-500 ${
          resolvedTheme === 'dark' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-180 scale-75'
        }`}
      />
      
      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-full bg-current opacity-0 scale-0 group-active:opacity-20 group-active:scale-100 transition-all duration-150" />
    </button>
  )
} 