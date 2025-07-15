'use client'

import { useDarkMode } from '@/src/hooks/useDarkMode'

export default function RecentActivitySection() {
  const { isDarkMode, mounted } = useDarkMode()

  if (!mounted) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-6 w-1/2"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`backdrop-blur-xl rounded-2xl shadow-2xl p-6 border ${
      isDarkMode 
        ? 'bg-gray-800/90 border-gray-700/30' 
        : 'bg-white/90 border-white/20'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-semibold ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>Recent Activity</h2>
      </div>
      
      <div className="space-y-4">
        {/* Placeholder activity items */}
        {[1, 2, 3].map((item) => (
          <div key={item} className={`backdrop-blur-sm rounded-xl h-16 flex items-center px-4 border ${
            isDarkMode
              ? 'bg-gradient-to-r from-gray-700/60 to-gray-600/60 border-gray-600/30'
              : 'bg-gradient-to-r from-gray-100/60 to-gray-200/60 border-gray-200/30'
          }`}>
            <div className="flex-1">
              <div className={`h-3 rounded mb-2 w-4/5 ${
                isDarkMode ? 'bg-gray-600/70' : 'bg-gray-200/70'
              }`}></div>
              <div className={`h-2 rounded w-3/5 ${
                isDarkMode ? 'bg-gray-600/70' : 'bg-gray-200/70'
              }`}></div>
            </div>
            <div className={`w-6 h-6 rounded border ${
              isDarkMode 
                ? 'bg-gray-600/70 border-gray-500/30' 
                : 'bg-gray-200/70 border-gray-300/30'
            }`}></div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <button className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors border ${
          isDarkMode
            ? 'bg-gradient-to-r from-gray-700/60 to-gray-600/60 text-gray-500 hover:text-gray-300 border-gray-600/30'
            : 'bg-gradient-to-r from-gray-100/60 to-gray-200/60 text-gray-400 hover:text-gray-600 border-gray-300/30'
        }`}>
          <span className="text-lg">?</span>
        </button>
      </div>
    </div>
  )
} 