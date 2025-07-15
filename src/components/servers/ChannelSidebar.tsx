'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServerWithDetails, ServerChannel } from '../../types/server';
import { 
  HashtagIcon, 
  SpeakerWaveIcon, 
  MegaphoneIcon, 
  UserGroupIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';

interface ChannelSidebarProps {
  server: ServerWithDetails;
  currentChannelId?: string;
  onChannelSelect: (channel: ServerChannel) => void;
  onAddChannel?: (type: string) => void;
}

export function ChannelSidebar({
  server,
  currentChannelId,
  onChannelSelect,
  onAddChannel,
}: ChannelSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();

  if (!mounted) return null;

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'text':
      case 'chat':
        return HashtagIcon;
      case 'voice':
        return SpeakerWaveIcon;
      case 'announcement':
      case 'post':
        return MegaphoneIcon;
      default:
        return HashtagIcon;
    }
  };

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'text':
      case 'chat':
        return 'text-blue-400';
      case 'voice':
        return 'text-green-400';
      case 'announcement':
      case 'post':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSettingsClick = () => {
    router.push(`/servers/${server.id}/settings`);
  };

  // Group root channels into posts vs chat
  const rootChannels = server.channels?.filter(c => !c.parent_id && c.type !== 'category') || [];
  const chatRoot = rootChannels.filter(c => ['chat', 'text', 'voice'].includes(c.type as string));
  const postsRoot = rootChannels.filter(c => ['post', 'announcement'].includes(c.type as string));

  const channelGroups = {
    chatRoot,
    postsRoot,
    categories: server.channels?.filter(channel => channel.type === 'category') || [],
  };

  // Get channels for each category
  const getChannelsForCategory = (categoryId: string) => {
    return server.channels?.filter(channel => channel.parent_id === categoryId) || [];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Server Header */}
      <div className={`p-4 border-b ${
        isDarkMode ? 'border-slate-700/30' : 'border-border/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {server.icon_url ? (
              <img
                src={server.icon_url}
                alt={server.name}
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-foreground truncate">{server.name}</h2>
              <p className="text-xs text-muted-foreground">
                {server.member_count} {server.member_count === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>
          
          {/* Server Settings */}
          {server.is_owner && (
            <button onClick={handleSettingsClick} className="p-2 rounded-lg transition-colors duration-150 hover:bg-primary/15 group">
              <Cog6ToothIcon className="w-5 h-5 text-muted-foreground transition-colors duration-150 group-hover:text-primary" />
            </button>
          )}
        </div>

        {/* Server Description */}
        {server.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {server.description}
          </p>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {/* Chat Section */}
        {channelGroups.chatRoot.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chat</h4>
              {server.is_owner && (
                <button onClick={() => onAddChannel && onAddChannel('chat')} className="p-1 rounded transition-colors duration-150 hover:bg-primary/15 group">
                  <PlusIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform duration-150 group-hover:rotate-90" />
                </button>
              )}
            </div>
            {channelGroups.chatRoot.map((channel) => {
              const Icon = getChannelIcon(channel.type);
              const isActive = currentChannelId === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => onChannelSelect(channel)}
                  className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-sm transition-all duration-150 group ${isActive ? 'bg-white/10 text-white font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : getChannelTypeColor(channel.type)}`} />
                  <span className="flex-1 text-left truncate font-medium">{channel.name}</span>
                  {channel.is_private && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>}
                </button>
              );
            })}
          </div>
        )}

        {/* Posts Section */}
        <div className="space-y-1 mt-6">
          <div className="flex items-center justify-between px-2 py-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posts</h4>
            {server.is_owner && (
              <button onClick={() => onAddChannel && onAddChannel('post')} className="p-1 rounded transition-colors duration-150 hover:bg-primary/15 group">
                <PlusIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform duration-150 group-hover:rotate-90" />
              </button>
            )}
          </div>
          {channelGroups.postsRoot.map((channel) => {
            const Icon = getChannelIcon(channel.type);
            const isActive = currentChannelId === channel.id;
            return (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-sm transition-all duration-150 group ${isActive ? 'bg-white/10 text-white font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : getChannelTypeColor(channel.type)}`} />
                <span className="flex-1 text-left truncate font-medium">{channel.name}</span>
                {channel.is_private && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>}
              </button>
            );
          })}
        </div>

        {/* Categories and their channels */}
        {channelGroups.categories.map((category) => {
          const categoryChannels = getChannelsForCategory(category.id);
          const isExpanded = expandedCategories.has(category.id);
          
          if (categoryChannels.length === 0) return null;

          return (
            <div key={category.id} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center space-x-2 px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 group"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronRightIcon className="w-3 h-3" />
                )}
                <span className="flex-1 text-left uppercase tracking-wider">
                  {category.name}
                </span>
                <PlusIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 group-hover:text-primary" />
              </button>

              {/* Category Channels */}
              {isExpanded && (
                <div className="space-y-1 ml-2">
                  {categoryChannels.map((channel) => {
                    const Icon = getChannelIcon(channel.type);
                    const isActive = currentChannelId === channel.id;
                    
                    return (
                      <button
                        key={channel.id}
                        onClick={() => onChannelSelect(channel)}
                        className={`
                          w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-sm transition-all duration-150 group
                          ${isActive
                            ? 'bg-white/10 text-white font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : getChannelTypeColor(channel.type)}`} />
                        <span className="flex-1 text-left truncate font-medium">
                          {channel.name}
                        </span>
                        {channel.is_private && (
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Channel Button (for server admins) */}
        {server.is_owner && (
          <div className="pt-2">
            <button className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 group border-2 border-dashed border-border/50 hover:border-primary/50">
              <PlusIcon className="w-5 h-5" />
              <span className="font-medium">Add Channel</span>
            </button>
          </div>
        )}
      </div>

      {/* Server Info Footer */}
      <div className={`p-3 border-t ${
        isDarkMode ? 'border-slate-700/30' : 'border-border/30'
      }`}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Online: {Math.floor(server.member_count * 0.3)}</span>
          <span>Total: {server.member_count}</span>
        </div>
      </div>
    </div>
  );
}
