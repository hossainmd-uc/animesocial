'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { useDarkMode } from '@/src/hooks/useDarkMode'
import {
  CheckCircleIcon,
  PlusIcon,
  StarIcon,
  PlayIcon,
  HeartIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/solid'

interface Activity {
  id: string
  actionType: string
  oldValue?: string
  newValue?: string
  createdAt: string
  metadata?: {
    animeTitle?: string
    finalScore?: number
    totalEpisodes?: number
    [key: string]: any
  }
  anime?: {
    id: string
    title: string
    imageUrl: string
    episodes?: number
  }
  series?: {
    id: string
    title: string
    imageUrl?: string
    totalEpisodes?: number
  }
}

export default function RecentActivitySection() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { isDarkMode, mounted } = useDarkMode()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await fetchActivities()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/user/activities?limit=5')
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'plan_to_watch': 'Plan to Watch',
      'watching': 'Watching',
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'dropped': 'Dropped'
    }
    return statusMap[status] || status
  }

  const getActivityIcon = (actionType: string) => {
    const iconClass = `w-5 h-5 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`
    
    switch (actionType) {
      case 'completed_anime':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case 'added_anime':
        return <PlusIcon className={`${iconClass} text-blue-500`} />
      case 'updated_score':
        return <StarIcon className={`${iconClass} text-yellow-500`} />
      case 'updated_progress':
        return <PlayIcon className={`${iconClass} text-purple-500`} />
      case 'marked_favorite':
        return <HeartIcon className={`${iconClass} text-red-500`} />
      case 'unmarked_favorite':
        return <XMarkIcon className={`${iconClass} text-gray-500`} />
      case 'status_changed':
        return <ArrowPathIcon className={`${iconClass} text-blue-500`} />
      case 'removed_anime':
        return <TrashIcon className={`${iconClass} text-red-500`} />
      default:
        return <PencilIcon className={`${iconClass} text-gray-500`} />
    }
  }

  const getActivityDescription = (activity: Activity) => {
    const animeTitle = activity.anime?.title || activity.metadata?.animeTitle || 'Unknown Anime'
    
    switch (activity.actionType) {
      case 'completed_anime':
        const score = activity.metadata?.finalScore
        return {
          primary: `Completed ${animeTitle}`,
          secondary: score ? `Rated ${score}/10` : 'Finished watching'
        }
      case 'added_anime':
        const formattedStatus = formatStatus(activity.newValue || '')
        return {
          primary: `Added ${animeTitle}`,
          secondary: activity.newValue === 'plan_to_watch' ? 'To watchlist' : `Status: ${formattedStatus}`
        }
      case 'updated_score':
        return {
          primary: `Rated ${animeTitle}`,
          secondary: activity.oldValue 
            ? `${activity.oldValue}/10 → ${activity.newValue}/10`
            : `${activity.newValue}/10`
        }
      case 'updated_progress':
        const total = activity.anime?.episodes || activity.metadata?.totalEpisodes
        return {
          primary: `Watched episode ${activity.newValue}`,
          secondary: `of ${animeTitle}${total ? ` (${activity.newValue}/${total})` : ''}`
        }
      case 'marked_favorite':
        return {
          primary: `Added ${animeTitle}`,
          secondary: 'to favorites'
        }
      case 'unmarked_favorite':
        return {
          primary: `Removed ${animeTitle}`,
          secondary: 'from favorites'
        }
      case 'status_changed':
        const oldStatus = formatStatus(activity.oldValue || '')
        const newStatus = formatStatus(activity.newValue || '')
        return {
          primary: `Updated ${animeTitle}`,
          secondary: `${oldStatus} → ${newStatus}`
        }
      case 'removed_anime':
        return {
          primary: `Removed ${animeTitle}`,
          secondary: 'from anime list'
        }
      default:
        return {
          primary: animeTitle,
          secondary: activity.actionType.replace('_', ' ')
        }
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return diffMins < 1 ? 'Just now' : `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

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

  if (loading) {
    return (
      <div className={`backdrop-blur-xl rounded-2xl shadow-2xl p-6 border ${
        isDarkMode 
          ? 'bg-gray-800/90 border-gray-700/30' 
          : 'bg-white/90 border-white/20'
      } animate-pulse`}>
        <div className={`h-6 rounded mb-6 w-1/2 ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}></div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className={`h-16 rounded-xl ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}></div>
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
        {activities.length > 0 && (
          <button 
            className={`text-sm transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            View all
          </button>
        )}
      </div>
      
      {activities.length === 0 ? (
        <div className={`text-center py-8 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="mb-3">
            <PencilIcon className={`w-12 h-12 mx-auto ${
              isDarkMode ? 'text-gray-600' : 'text-gray-300'
            }`} />
          </div>
          <p className="text-sm font-medium">No recent activity</p>
          <p className="text-xs mt-1">Start tracking anime to see your activity here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const description = getActivityDescription(activity)
            return (
              <div key={activity.id} className={`backdrop-blur-sm rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] border ${
                isDarkMode
                  ? 'bg-gradient-to-r from-gray-700/60 to-gray-600/60 border-gray-600/30 hover:from-gray-600/70 hover:to-gray-500/70'
                  : 'bg-gradient-to-r from-gray-100/60 to-gray-200/60 border-gray-200/30 hover:from-gray-200/70 hover:to-gray-300/70'
              }`}>
                <div className="flex items-start space-x-3">
                  {/* Activity Icon */}
                  <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                    {getActivityIcon(activity.actionType)}
                  </div>
                  
                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {description.primary}
                    </div>
                    <div className={`text-xs truncate ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {description.secondary}
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs flex-shrink-0 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {formatTimeAgo(activity.createdAt)}
                  </div>
                  
                  {/* Anime Image */}
                  {activity.anime?.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={activity.anime.imageUrl}
                        alt={activity.anime.title}
                        className="w-8 h-10 object-cover rounded border border-gray-300/30"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 