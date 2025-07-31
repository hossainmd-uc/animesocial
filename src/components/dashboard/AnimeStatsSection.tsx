'use client'

import { useState, useEffect } from 'react'
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
          
          // Add episodes watched
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
      color: 'text-green-500',
      bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-50',
      borderColor: 'border-green-500/20'
    },
    {
      label: 'Watching',
      value: stats.watching,
      icon: <PlayIcon className="w-6 h-6" />,
      color: 'text-blue-500',
      bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Plan to Watch',
      value: stats.planToWatch,
      icon: <ClockIcon className="w-6 h-6" />,
      color: 'text-yellow-500',
      bgColor: isDarkMode ? 'bg-yellow-500/10' : 'bg-yellow-50',
      borderColor: 'border-yellow-500/20'
    },
    {
      label: 'On Hold',
      value: stats.onHold,
      icon: <PauseIcon className="w-6 h-6" />,
      color: 'text-orange-500',
      bgColor: isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50',
      borderColor: 'border-orange-500/20'
    },
    {
      label: 'Dropped',
      value: stats.dropped,
      icon: <XMarkIcon className="w-6 h-6" />,
      color: 'text-red-500',
      bgColor: isDarkMode ? 'bg-red-500/10' : 'bg-red-50',
      borderColor: 'border-red-500/20'
    }
  ]

  if (!mounted) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-6 w-1/2"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-20 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`backdrop-blur-xl rounded-2xl shadow-2xl p-6 border gamer-card-hover scan-lines ${
        isDarkMode 
          ? 'bg-gray-800/90 border-gray-700/30' 
          : 'bg-white/90 border-white/20'
      } animate-pulse`}>
        <div className={`h-6 rounded mb-6 w-1/2 ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className={`h-20 rounded-xl ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}></div>
          ))}
        </div>
      </div>
    )
  }

  const totalAnime = stats.completed + stats.watching + stats.planToWatch + stats.onHold + stats.dropped

  return (
    <div className={`backdrop-blur-xl rounded-2xl shadow-2xl p-6 border gamer-card-hover scan-lines ${
      isDarkMode 
        ? 'bg-gray-800/90 border-gray-700/30' 
        : 'bg-white/90 border-white/20'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-semibold ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>Anime Statistics</h2>
        <div className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {totalAnime} total
        </div>
      </div>

      {totalAnime === 0 ? (
        <div className={`text-center py-8 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="mb-3">
            <PlayIcon className={`w-12 h-12 mx-auto ${
              isDarkMode ? 'text-gray-600' : 'text-gray-300'
            }`} />
          </div>
          <p className="text-sm font-medium">No anime tracked yet</p>
          <p className="text-xs mt-1">Start adding anime to see your statistics!</p>
        </div>
      ) : (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {statItems.map((item) => (
              <div key={item.label} className={`${item.bgColor} ${item.borderColor} border rounded-xl p-4 transition-all duration-200 hover:scale-105`}>
                <div className="flex items-center space-x-3">
                  <div className={`${item.color} flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {item.value}
                    </div>
                    <div className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {item.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Episodes Counter */}
          <div className={`rounded-xl p-4 border transition-all duration-200 ${
            isDarkMode 
              ? 'bg-purple-500/10 border-purple-500/20' 
              : 'bg-purple-50 border-purple-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-lg font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {stats.totalEpisodes.toLocaleString()}
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Episodes Watched
                </div>
              </div>
              <div className="text-purple-500">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 