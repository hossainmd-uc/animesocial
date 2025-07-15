'use client';

import { useState } from 'react'
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { useDarkMode } from '@/src/hooks/useDarkMode'

interface Server {
  id: string
  name: string
  icon?: string
}

interface ServerSidebarProps {
  servers: Server[]
  currentServerId?: string
  onServerSelect: (serverId: string) => void
  onCreateServer: () => void
  onJoinServer: () => void
}

export function ServerSidebar({
  servers,
  currentServerId,
  onServerSelect,
  onCreateServer,
  onJoinServer
}: ServerSidebarProps) {
  const [hoveredServer, setHoveredServer] = useState<string | null>(null)
  const { isDarkMode, mounted } = useDarkMode()

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse">
        <div className="p-3 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-3 space-y-3 overflow-y-auto">
      {/* Server list */}
      {servers.map((server) => (
        <div key={server.id} className="relative">
          <button
            onClick={() => onServerSelect(server.id)}
            onMouseEnter={() => setHoveredServer(server.id)}
            onMouseLeave={() => setHoveredServer(null)}
            className={`w-12 h-12 rounded-2xl transition-all duration-300 flex items-center justify-center text-white font-bold text-lg hover:rounded-xl group relative ${
              currentServerId === server.id
                ? 'bg-blue-600 rounded-xl scale-110'
                : isDarkMode
                  ? 'bg-slate-700/80 text-foreground hover:bg-primary/20 hover:bg-slate-600'
                  : 'bg-card/80 text-foreground hover:bg-primary/20 hover:bg-gray-100'
            }`}
          >
            {server.icon ? (
              <img src={server.icon} alt={server.name} className="w-8 h-8 rounded-lg" />
            ) : (
              server.name.charAt(0).toUpperCase()
            )}
          </button>

          {/* Server name tooltip */}
          {hoveredServer === server.id && (
            <div className="absolute left-16 top-0 z-50 animate-in slide-in-from-left-2 duration-200">
              <div className={`border rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-card border-border'
              }`}>
                <p className="text-sm font-medium whitespace-nowrap text-foreground">
                  {server.name}
                </p>
              </div>
              <div className={`w-2 h-2 border-l border-b transform rotate-45 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-card border-border'
              }`}></div>
            </div>
          )}
        </div>
      ))}

      {/* Separator */}
      <div className={`w-8 h-px my-2 ${
        isDarkMode ? 'bg-slate-600/50' : 'bg-border/50'
      }`}></div>

      {/* Add Server Button */}
      <div className="relative">
        <button
          onClick={onCreateServer}
          onMouseEnter={() => setHoveredServer('create')}
          onMouseLeave={() => setHoveredServer(null)}
          className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-300 flex items-center justify-center group border-2 border-dashed hover:border-green-500/50 ${
            isDarkMode
              ? 'bg-slate-700/80 hover:bg-green-500/20 border-slate-600/50'
              : 'bg-card/80 hover:bg-green-500/20 border-border/50'
          }`}
        >
          <PlusIcon className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform duration-300" />
        </button>

        {hoveredServer === 'create' && (
          <div className="absolute left-16 top-0 z-50 animate-in slide-in-from-left-2 duration-200">
            <div className={`border rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-card border-border'
            }`}>
              <p className="text-sm font-medium whitespace-nowrap text-foreground">
                Create Server
              </p>
            </div>
            <div className={`w-2 h-2 border-l border-b transform rotate-45 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-card border-border'
            }`}></div>
          </div>
        )}
      </div>

      {/* Join Server Button */}
      <div className="relative">
        <button
          onClick={onJoinServer}
          onMouseEnter={() => setHoveredServer('join')}
          onMouseLeave={() => setHoveredServer(null)}
          className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-300 flex items-center justify-center group border-2 border-dashed hover:border-blue-500/50 ${
            isDarkMode
              ? 'bg-slate-700/80 hover:bg-blue-500/20 border-slate-600/50'
              : 'bg-card/80 hover:bg-blue-500/20 border-border/50'
          }`}
        >
          <UserGroupIcon className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
        </button>

        {hoveredServer === 'join' && (
          <div className="absolute left-16 top-0 z-50 animate-in slide-in-from-left-2 duration-200">
            <div className={`border rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-card border-border'
            }`}>
              <p className="text-sm font-medium whitespace-nowrap text-foreground">
                Join Server
              </p>
            </div>
            <div className={`w-2 h-2 border-l border-b transform rotate-45 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-card border-border'
            }`}></div>
          </div>
        )}
      </div>
    </div>
  )
} 