'use client'

import { useState } from 'react';
import Header from '@/src/components/layout/Header';
import UserSearch from '@/src/components/discover/UserSearch';
import ServerBrowser from '@/src/components/discover/ServerBrowser';
import { useDarkMode } from '@/src/hooks/useDarkMode';
import { UserGroupIcon, ServerIcon } from '@heroicons/react/24/outline';

export default function DiscoverPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const [activeTab, setActiveTab] = useState<'users' | 'servers'>('users');

  if (!mounted) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
      }`}>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className={`h-8 rounded w-64 mx-auto ${
              isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
            }`} />
            <div className={`h-12 rounded w-96 mx-auto ${
              isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
            }`} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-64 rounded-lg ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="gamer-gradient transition-colors duration-300 relative min-h-screen">
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
      
      {/* Stylized Vertical Discover Text */}
      <div className="dashboard-text">
        DISCOVER
      </div>
      
      <Header />
      
      {/* Main Content Section */}
      <main className="container mx-auto px-6 relative z-10 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Discover
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Find amazing anime communities and connect with fellow fans
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className={`inline-flex rounded-lg p-1 border backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-slate-800/80 border-slate-700/50' 
              : 'bg-white/80 border-gray-200/50'
          }`}>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'users'
                  ? isDarkMode
                    ? 'bg-white/90 text-slate-900 shadow-lg shadow-white/20'
                    : 'bg-primary text-black shadow-lg'
                  : isDarkMode
                    ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              Users
            </button>
            <button
              onClick={(e) => {
                // Prevent tab switching on mobile
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  e.preventDefault()
                  return
                }
                setActiveTab('servers')
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all duration-300 relative ${
                activeTab === 'servers'
                  ? isDarkMode
                    ? 'bg-white/90 text-slate-900 shadow-lg shadow-white/20'
                    : 'bg-primary text-black shadow-lg'
                  : isDarkMode
                    ? 'text-slate-300 md:hover:text-white md:hover:bg-slate-700/50'
                    : 'text-gray-600 md:hover:text-gray-900 md:hover:bg-gray-100/50'
              } md:cursor-pointer cursor-default md:opacity-100 opacity-60`}
              title="Server browsing is available on desktop only"
            >
              <ServerIcon className="w-5 h-5" />
              <span className="flex items-center gap-1">
                Servers
              </span>
            </button>
          </div>
        </div>

        {/* Mobile-only desktop hint */}
        <div className="md:hidden text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
            isDarkMode 
              ? 'bg-blue-900/20 text-blue-400 border border-blue-800/30' 
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            🖥️ Server browsing available on desktop
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'users' ? <UserSearch /> : <ServerBrowser />}
        </div>
      </main>
    </div>
  );
} 