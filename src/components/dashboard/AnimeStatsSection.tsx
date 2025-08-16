'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { useDarkMode } from '@/src/hooks/useDarkMode'
import {
  CheckCircleIcon,
  PlayIcon,
  ClockIcon,
  PauseIcon,
  XMarkIcon
} from '@heroicons/react/24/solid'

interface AnimeStats {
  completed: number
  watching: number
  planToWatch: number
  onHold: number
  dropped: number
  totalEpisodes: number
}

export default function AnimeStatsSection() {
  const [stats, setStats] = useState<AnimeStats>({
    completed: 0,
    watching: 0,
    planToWatch: 0,
    onHold: 0,
    dropped: 0,
    totalEpisodes: 0
  })
  const [loading, setLoading] = useState(true)
  const { isDarkMode, mounted } = useDarkMode()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/anime-list')
      if (response.ok) {
        const animeList = await response.json()
        
        const statsData = animeList.reduce((acc: AnimeStats, item: any) => {
          switch (item.status) {
            case 'completed':
              acc.completed++
              break
            case 'watching':
              acc.watching++
              break
            case 'plan_to_watch':
              acc.planToWatch++
              break
            case 'on_hold':
              acc.onHold++
              break
            case 'dropped':
              acc.dropped++
              break
          }
          
          if (item.progress && item.anime?.episodes) {
            acc.totalEpisodes += item.progress
          } else if (item.status === 'completed' && item.anime?.episodes) {
            acc.totalEpisodes += item.anime.episodes
          }
          
          return acc
        }, {
          completed: 0,
          watching: 0,
          planToWatch: 0,
          onHold: 0,
          dropped: 0,
          totalEpisodes: 0
        })

        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching anime stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statItems = [
    {
      label: 'Completed',
      value: stats.completed,
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: isDarkMode ? 'text-green-400' : 'text-green-600'
    },
    {
      label: 'Watching',
      value: stats.watching,
      icon: <PlayIcon className="w-6 h-6" />,
      color: isDarkMode ? 'text-blue-400' : 'text-blue-600'
    },
    {
      label: 'Planned',
      value: stats.planToWatch,
      icon: <ClockIcon className="w-6 h-6" />,
      color: isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
    },
    {
      label: 'On Hold',
      value: stats.onHold,
      icon: <PauseIcon className="w-6 h-6" />,
      color: isDarkMode ? 'text-orange-400' : 'text-orange-600'
    },
    {
      label: 'Dropped',
      value: stats.dropped,
      icon: <XMarkIcon className="w-6 h-6" />,
      color: isDarkMode ? 'text-red-400' : 'text-red-600'
    }
  ]

  if (!mounted) {
    return (
      <div className={`p-6 h-96 flex flex-col animate-pulse ${
        // Mobile only: Add background container matching other dashboard components
        'md:bg-transparent md:backdrop-blur-none md:shadow-none md:rounded-none md:[box-shadow:none] md:[backdrop-filter:none] ' +
        (isDarkMode 
          ? 'backdrop-blur-xl bg-gray-800/40 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] shadow-gray-900/20 rounded-2xl md:bg-transparent md:backdrop-blur-none md:shadow-none md:[box-shadow:none] md:[backdrop-filter:none]' 
          : 'backdrop-blur-xl bg-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shadow-gray-900/5 rounded-2xl md:bg-transparent md:backdrop-blur-none md:shadow-none md:[box-shadow:none] md:[backdrop-filter:none]'
        )
      }`}>
        <div className="mb-6">
          <div className={`h-6 rounded w-1/2 ${isDarkMode ? 'bg-gray-600/30' : 'bg-gray-200/30'}`}></div>
        </div>
        <div className="flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className={`h-16 rounded ${isDarkMode ? 'bg-gray-700/20' : 'bg-gray-100/20'}`}></div>
            ))}
          </div>
          <div className={`h-16 rounded ${isDarkMode ? 'bg-gray-700/20' : 'bg-gray-100/20'}`}></div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`p-6 h-96 flex flex-col transition-all duration-300 animate-pulse ${
        // Mobile only: Add background container matching other dashboard components
        'md:bg-transparent md:backdrop-blur-none md:shadow-none md:rounded-none md:[box-shadow:none] md:[backdrop-filter:none] ' +
        (isDarkMode 
          ? 'backdrop-blur-xl bg-gray-800/40 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] shadow-gray-900/20 rounded-2xl md:bg-transparent md:backdrop-blur-none md:shadow-none md:[box-shadow:none] md:[backdrop-filter:none]' 
          : 'backdrop-blur-xl bg-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shadow-gray-900/5 rounded-2xl md:bg-transparent md:backdrop-blur-none md:shadow-none md:[box-shadow:none] md:[backdrop-filter:none]'
        )
      }`}>
        <div className="mb-6">
          <div className={`h-6 rounded w-1/2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
        </div>
        <div className="flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className={`h-16 rounded-xl ${isDarkMode ? 'bg-gray-700/20' : 'bg-gray-100/20'}`}></div>
            ))}
          </div>
          <div className={`h-16 rounded-xl ${isDarkMode ? 'bg-gray-700/20' : 'bg-gray-100/20'}`}></div>
        </div>
      </div>
    )
  }

  const totalAnime = stats.completed + stats.watching + stats.planToWatch + stats.onHold + stats.dropped

  return (
    <div className={`p-6 h-96 flex flex-col transition-all duration-300 ${
      // Mobile only: Add background container matching other dashboard components
      'md:bg-transparent md:backdrop-blur-none md:shadow-none md:rounded-none md:[box-shadow:none] md:[backdrop-filter:none] ' +
      (isDarkMode 
        ? 'backdrop-blur-xl bg-gray-800/40 shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] shadow-gray-900/20 rounded-2xl md:bg-transparent md:backdrop-blur-none md:shadow-none md:[box-shadow:none] md:[backdrop-filter:none]' 
        : 'backdrop-blur-xl bg-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] shadow-gray-900/5 rounded-2xl md:bg-transparent md:backdrop-blur-none md:shadow-none md:[box-shadow:none] md:[backdrop-filter:none]'
      )
    }`}>
      <div className="mb-6 text-center">
                  <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} tracking-wide`}>
          Anime Statistics
        </h2>
      </div>

      {totalAnime === 0 ? (
        <div className={`text-center py-8 flex-1 flex flex-col justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="mb-3">
            <PlayIcon className={`w-12 h-12 mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          </div>
          <p className="text-sm font-medium">No anime tracked yet</p>
          <p className="text-xs mt-1">Start adding anime to see your statistics!</p>
        </div>
      ) : (
        <div className="flex-1 flex justify-center items-center">
          {/* Stats Grid Layout */}
          <div className="flex flex-col gap-1.5 py-2 w-full max-w-xs mx-auto">
            {/* Top Row - 3 columns */}
            <div className="grid grid-cols-3 gap-1.5">
              {statItems.slice(0, 3).map((item, index) => (
                <div key={item.label} className="flex flex-col items-center text-center">
                  {/* Complete Stat Box */}
                  <div className={`text-center p-2.5 md:p-4 rounded-lg md:rounded-xl backdrop-blur-md transition-all duration-300 h-20 w-20 md:h-26 md:w-26 flex flex-col justify-center items-center ${
                    index === 0 ? (isDarkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-100 border border-green-300') :
                    index === 1 ? (isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-100 border border-blue-300') :
                    (isDarkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-100 border border-yellow-300')
                  }`}>
                    {/* Icon at top */}
                    <div className={`${item.color} mb-1 flex justify-center`}>
                      <div className="w-3 h-3 md:w-4 md:h-4 flex items-center justify-center">
                        {item.icon}
                      </div>
                    </div>
                    
                    {/* Number */}
                    <div className={`text-sm md:text-lg font-bold mb-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {item.value}
                    </div>
                    
                    {/* Label */}
                    <div className={`text-xs font-medium leading-tight text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row - 3 columns with proper spacing */}
            <div className="grid grid-cols-3 gap-1.5">
              {/* Left element (On Hold) */}
              <div className="flex flex-col items-center text-center">
                <div className={`text-center p-2.5 md:p-4 rounded-lg md:rounded-xl backdrop-blur-md transition-all duration-300 h-20 w-20 md:h-26 md:w-26 flex flex-col justify-center items-center ${
                  isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-100 border border-orange-300'
                }`}>
                  <div className={`${statItems[3].color} mb-1 flex justify-center`}>
                    <div className="w-3 h-3 md:w-4 md:h-4 flex items-center justify-center">
                      {statItems[3].icon}
                    </div>
                  </div>
                  <div className={`text-sm md:text-lg font-bold mb-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {statItems[3].value}
                  </div>
                  <div className={`text-xs font-medium leading-tight text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {statItems[3].label}
                  </div>
                </div>
              </div>

              {/* Center element (Episodes Watched) - same width as Watching */}
              <div className="flex flex-col items-center text-center">
                <div className={`text-center p-2.5 md:p-4 rounded-lg md:rounded-xl backdrop-blur-md transition-all duration-300 h-20 w-20 md:h-26 md:w-26 flex flex-col justify-center items-center ${
                  isDarkMode ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-100 border border-purple-300'
                }`}>
                  <div className={`mb-1 flex justify-center ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className={`text-sm md:text-lg font-bold mb-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {stats.totalEpisodes.toLocaleString()}
                  </div>
                  <div className={`text-xs font-medium leading-tight text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Episodes Watched
                  </div>
                </div>
              </div>

              {/* Right element (Dropped) */}
              <div className="flex flex-col items-center text-center">
                <div className={`text-center p-2.5 md:p-4 rounded-lg md:rounded-xl backdrop-blur-md transition-all duration-300 h-20 w-20 md:h-26 md:w-26 flex flex-col justify-center items-center ${
                  isDarkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-100 border border-red-300'
                }`}>
                  <div className={`${statItems[4].color} mb-1 flex justify-center`}>
                    <div className="w-3 h-3 md:w-4 md:h-4 flex items-center justify-center">
                      {statItems[4].icon}
                    </div>
                  </div>
                  <div className={`text-sm md:text-lg font-bold mb-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {statItems[4].value}
                  </div>
                  <div className={`text-xs font-medium leading-tight text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {statItems[4].label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
