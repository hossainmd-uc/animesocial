'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/src/components/auth/LogoutButton'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
      label: 'Home'
    },
    {
      href: '/animes',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Animes'
    },
    {
      href: '/watchlist',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      ),
      label: 'Watchlist'
    },
    {
      href: '/servers',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Servers'
    },
    {
      href: '/discover',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Discover'
    }
  ]

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      <div className="content-wrapper">
        <div className="flex items-center justify-between py-4 section-padding">
          {/* Logo */}
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-3 text-gray-800 dark:text-slate-100 hover:scale-105 transition-transform duration-300 group"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-blue-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg">A</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 dark:from-slate-100 dark:to-blue-400 bg-clip-text text-transparent">
              AnimeHub
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg rounded-2xl px-3 py-2 border border-gray-200/20 dark:border-slate-700/20 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/watchlist' && pathname === '/favorites')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative p-3 rounded-xl transition-all duration-300 flex items-center justify-center group ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500/15 via-purple-600/15 to-blue-600/15 text-purple-700 dark:text-blue-300 shadow-lg scale-105 border border-purple-200/20 dark:border-blue-400/20'
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100/50 dark:hover:bg-slate-700/50 hover:scale-105'
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

          {/* Right side - Combined floating controls with divider */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg rounded-2xl px-4 py-3 border border-gray-200/20 dark:border-slate-700/20 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
              <ThemeToggle />
              <div className="w-px h-6 bg-gray-300/40 dark:bg-slate-600/40"></div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 