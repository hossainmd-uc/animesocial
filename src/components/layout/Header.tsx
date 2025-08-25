'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import LogoutButton from '@/src/components/auth/LogoutButton'
import ThemeToggle from './ThemeToggle'
import { useDarkMode } from '@/src/hooks/useDarkMode'

interface NavItem {
  href: string;
  icon: React.ReactElement;
  label: string;
  hideOnMobile?: boolean;
}

export default function Header() {
  const pathname = usePathname()
  const { isDarkMode, mounted } = useDarkMode()
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu when clicking outside or on navigation
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMobileMenuOpen(false)
    }

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Check database connection status
  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        const response = await fetch('/api/user/anime-list', { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        setDbStatus(response.ok ? 'connected' : 'disconnected');
      } catch (error) {
        setDbStatus('disconnected');
      }
    };

    if (mounted) {
      checkDbConnection();
      // Check every 30 seconds
      const interval = setInterval(checkDbConnection, 30000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
      label: 'Home'
    },
    {
      href: '/discover',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      ),
      label: 'Profiles'
    },
    {
      href: '/watchlist',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      ),
      label: 'Watchlist'
    },
    {
      href: '/servers',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Servers',
      hideOnMobile: true
    },
    {
      href: '/animes',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 2v6h12V7H4z" clipRule="evenodd" />
          <path d="M6 16h8v1H6v-1z" />
        </svg>
      ),
      label: 'Browse',
      hideOnMobile: false
    }
  ]

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 transition-all duration-300">
        <div className="content-wrapper">
          <div className="flex items-center justify-between py-4 section-padding">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-64 h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      <div className="content-wrapper">
        <div className="flex items-center justify-between py-3 md:py-6 section-padding">
          {/* Logo with floating styling - Responsive */}
          <Link 
            href="/dashboard" 
            className="hover:scale-105 transition-transform duration-300 group"
          >
            <div className={`flex items-center space-x-2 md:space-x-4 backdrop-blur-lg rounded-xl md:rounded-2xl px-3 py-2 md:px-5 md:py-4 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 ${
              isDarkMode
                ? 'bg-slate-800/40'
                : 'bg-white/40'
            }`}>
            <div className="relative">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-pink-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-blue-500 rounded-lg md:rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm md:text-xl">A</span>
            </div>
            <span className={`text-lg md:text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
              isDarkMode 
                ? 'from-slate-100 to-blue-400' 
                : 'from-blue-600 via-purple-600 to-pink-600'
            }`}>
              AnimeHub
            </span>
            </div>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className={`hidden md:flex items-center space-x-2 backdrop-blur-lg rounded-2xl px-4 py-3 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 ${
            isDarkMode
              ? 'bg-slate-800/40'
              : 'bg-white/40'
          }`}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                               (item.href === '/watchlist' && pathname === '/favorites') ||
                               (item.href === '/discover' && pathname.startsWith('/discover/'))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative p-4 rounded-xl transition-all duration-300 flex items-center justify-center group ${
                    isActive
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-pink-500/15 via-purple-600/15 to-blue-600/15 text-blue-300 shadow-lg scale-105'
                        : 'bg-gradient-to-r from-pink-500/15 via-purple-600/15 to-blue-600/15 text-purple-700 shadow-lg scale-105'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 hover:scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 hover:scale-105'
                  }`}
                  title={item.label}
                >
                  {/* Subtle active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 via-purple-500/5 to-blue-500/5 rounded-xl blur-md" />
                  )}
                  
                  {/* Icon */}
                  <div className="relative z-10 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  
                  {/* Subtle hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-purple-500/3 to-blue-400/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              )
            })}
          </nav>

          {/* Right side - Controls and Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Desktop Controls - Hidden on mobile */}
            <div className={`hidden md:flex items-center space-x-4 backdrop-blur-lg rounded-2xl px-5 py-4 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 ${
              isDarkMode
                ? 'bg-slate-800/40'
                : 'bg-white/40'
            }`}>
              {/* Database Status Indicator */}
              {dbStatus === 'disconnected' && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    DB Offline
                  </span>
                </div>
              )}
              
              <ThemeToggle />
              <div className={`w-px h-6 ${
                isDarkMode ? 'bg-slate-600/40' : 'bg-gray-300/40'
              }`}></div>
              <LogoutButton />
            </div>

            {/* Mobile Controls - Only theme toggle */}
            <div className={`md:hidden flex items-center space-x-2 backdrop-blur-lg rounded-xl px-3 py-2 ${
              isDarkMode
                ? 'bg-slate-800/40'
                : 'bg-white/40'
            }`}>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleMobileMenu()
              }}
              className={`md:hidden p-3 rounded-xl backdrop-blur-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 ${
                isDarkMode
                  ? 'bg-slate-800/40 text-slate-300 hover:text-slate-100'
                  : 'bg-white/40 text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Toggle mobile menu"
            >
              <div className="relative w-6 h-6">
                {/* Hamburger Icon */}
                <span className={`absolute block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2.5' : 'translate-y-1'
                }`} />
                <span className={`absolute block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'opacity-0' : 'translate-y-2.5'
                }`} />
                <span className={`absolute block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${
                  isMobileMenuOpen ? '-rotate-45 translate-y-2.5' : 'translate-y-4'
                }`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div 
            className={`md:hidden absolute top-full left-0 right-0 backdrop-blur-xl transition-all duration-300 border-t ${
              isDarkMode
                ? 'bg-slate-900/95 border-slate-700/50'
                : 'bg-white/95 border-gray-200/50'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-padding py-4">
              {/* Mobile Navigation Items */}
              <nav className="space-y-2 mb-4">
                              {navItems.filter(item => !item.hideOnMobile).map((item) => {
                const isActive = pathname === item.href || 
                                 (item.href === '/watchlist' && pathname === '/favorites') ||
                                 (item.href === '/discover' && pathname.startsWith('/discover/'))
                return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                        isActive
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-pink-500/15 via-purple-600/15 to-blue-600/15 text-blue-300'
                            : 'bg-gradient-to-r from-pink-500/15 via-purple-600/15 to-blue-600/15 text-purple-700'
                          : isDarkMode
                            ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Mobile Controls */}
              <div className={`pt-4 border-t space-y-3 ${
                isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'
              }`}>
                {/* Database Status */}
                {dbStatus === 'disconnected' && (
                  <div className="flex items-center space-x-2 px-4 py-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Database Offline
                    </span>
                  </div>
                )}
                
                {/* Logout Button */}
                <div className="px-4">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 