'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { useDarkMode } from '@/src/hooks/useDarkMode'
import { ChartBarIcon } from '@heroicons/react/24/solid'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface GenreData {
  name: string
  count: number
  percentage: number
  color: string
}

// Professional color palette for genres
const GENRE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
]

export default function GenreStatsSection() {
  const [genres, setGenres] = useState<GenreData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAnime, setTotalAnime] = useState(0)
  const [totalGenres, setTotalGenres] = useState(0)
  const { isDarkMode, mounted } = useDarkMode()

  useEffect(() => {
    fetchGenreStats()
  }, [])

  const fetchGenreStats = async () => {
    try {
      const response = await fetch('/api/user/anime-list')
      if (response.ok) {
        const animeList = await response.json()
        
        // Extract genres from user's anime
        const genreCount: { [key: string]: number } = {}
        let animeWithGenres = 0
        
        animeList.forEach((item: any) => {
          if (item.anime?.genres && item.anime.genres.length > 0) {
            animeWithGenres++
            item.anime.genres.forEach((genreRelation: any) => {
              const genreName = genreRelation.genre?.name
              if (genreName) {
                genreCount[genreName] = (genreCount[genreName] || 0) + 1
              }
            })
          }
        })

        // Convert to array and sort by count
        const genreArray = Object.entries(genreCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12) // Take top 12 genres

        const totalCount = genreArray.reduce((sum, genre) => sum + genre.count, 0)

        // Calculate percentages and add colors
        const genresWithData: GenreData[] = genreArray.map((genre, index) => ({
          ...genre,
          percentage: Number(((genre.count / totalCount) * 100).toFixed(1)),
          color: GENRE_COLORS[index % GENRE_COLORS.length]
        }))

        setGenres(genresWithData)
        setTotalAnime(animeWithGenres)
        setTotalGenres(Object.keys(genreCount).length)
      }
    } catch (error) {
      console.error('Error fetching genre stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className={`px-4 py-3 rounded-lg shadow-lg border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <p className="font-semibold text-base">{data.name}</p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {data.count} anime ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Custom label renderer for pie slices
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 3) return null // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    )
  }



  if (!mounted) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-6 w-1/2"></div>
        <div className="flex items-center justify-center">
          <div className="w-64 h-64 bg-gray-100 rounded-lg"></div>
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
        <div className="flex items-center justify-center">
          <div className={`w-64 h-64 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}></div>
        </div>
      </div>
    )
  }

  if (genres.length === 0) {
    return (
      <div className={`backdrop-blur-xl rounded-2xl shadow-2xl p-6 border gamer-card-hover scan-lines ${
        isDarkMode 
          ? 'bg-gray-800/90 border-gray-700/30' 
          : 'bg-white/90 border-white/20'
      }`}>
        <h2 className={`text-lg font-semibold mb-6 ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>Favorite Genres</h2>
        
        <div className={`text-center py-12 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="mb-4">
            <ChartBarIcon className={`w-16 h-16 mx-auto ${
              isDarkMode ? 'text-gray-600' : 'text-gray-300'
            }`} />
          </div>
          <p className="text-base font-medium">No genre data available</p>
          <p className="text-sm mt-2">Add anime to your list to see your favorite genres!</p>
        </div>
      </div>
    )
  }

  const topGenre = genres[0]

  return (
    <div className={`backdrop-blur-xl rounded-2xl shadow-2xl p-6 border gamer-card-hover scan-lines ${
      isDarkMode 
        ? 'bg-gray-800/90 border-gray-700/30' 
        : 'bg-white/90 border-white/20'
    }`}>
      <h2 className={`text-lg font-semibold mb-6 ${
        isDarkMode ? 'text-gray-100' : 'text-gray-900'
      }`}>Favorite Genres</h2>

      <div className="space-y-6">
        {/* Chart Container */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genres}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={35}
                fill="#8884d8"
                dataKey="count"
                animationBegin={0}
                animationDuration={1000}
              >
                {genres.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={isDarkMode ? '#374151' : '#f3f4f6'}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/20">
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {totalGenres}
            </div>
            <div className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Total Genres
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {totalAnime}
            </div>
            <div className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Anime with Genres
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {topGenre.name}
            </div>
            <div className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Top Genre
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 