'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import { ServerSidebar } from '../../components/servers/ServerSidebar';
import { ChannelSidebar } from '../../components/servers/ChannelSidebar';
import { ServerPostFeed } from '../../components/servers/ServerPostFeed';
import ServerChatFeed from '../../components/servers/ServerChatFeed';
import { CreateServerModal } from '../../components/servers/CreateServerModal';
import { JoinServerModal } from '../../components/servers/JoinServerModal';
import CreateChannelModal from '../../components/servers/CreateChannelModal';
import { getUserServers, getServer } from '../../lib/server-service';
import type { Server, ServerWithDetails, ServerChannel } from '../../types/server';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function ServersPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [currentServer, setCurrentServer] = useState<ServerWithDetails | null>(null);
  const [currentChannel, setCurrentChannel] = useState<ServerChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [defaultChannelType, setDefaultChannelType] = useState<'chat'|'post'>('chat');
  const { isDarkMode, mounted } = useDarkMode();

  useEffect(() => {
    loadUserServers();
  }, []);

  useEffect(() => {
    if (servers.length > 0 && !currentServer) {
      // Select first server by default
      handleServerSelect(servers[0].id);
    }
  }, [servers]);

  useEffect(() => {
    if (currentServer?.channels && currentServer.channels.length > 0 && !currentChannel) {
      // Select first channel by default
      setCurrentChannel(currentServer.channels[0]);
    }
  }, [currentServer]);

  const loadUserServers = async () => {
    try {
      const userServers = await getUserServers();
      setServers(userServers);
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServerSelect = async (serverId: string) => {
    try {
      const server = await getServer(serverId);
      setCurrentServer(server);
      setCurrentChannel(null); // Reset channel selection
    } catch (error) {
      console.error('Error loading server:', error);
    }
  };

  const handleChannelSelect = (channel: ServerChannel) => {
    setCurrentChannel(channel);
  };

  const handleServerCreated = (newServer: Server) => {
    setServers(prev => [newServer, ...prev]);
    setShowCreateModal(false);
    handleServerSelect(newServer.id);
  };

  const handleServerJoined = (server: Server) => {
    setServers(prev => [server, ...prev]);
    setShowJoinModal(false);
    handleServerSelect(server.id);
  };

  const handleAddChannel = (type: string) => {
    setDefaultChannelType(type as 'chat'|'post');
    setShowCreateChannelModal(true);
  };

  const handleChannelCreated = async (channel?: ServerChannel | null) => {
    if(currentServer){
      const updated = await getServer(currentServer.id);
      setCurrentServer(updated);
      if(updated && channel){
        setCurrentChannel(channel);
      }
    }
    setShowCreateChannelModal(false);
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen smooth-gradient transition-all duration-500">
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
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading your servers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen smooth-gradient transition-all duration-500">
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
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <Header />
      
      <div className="flex h-[calc(100vh-80px)] gap-4 px-4">
        {/* Server Sidebar - Far Left */}
        <div className={`w-20 flex-shrink-0 backdrop-blur-lg rounded-xl shadow-lg border flex flex-col ${
          isDarkMode 
            ? 'bg-slate-900/60 border-slate-700/30' 
            : 'bg-card/60 border-border/30'
        }`}>
          <ServerSidebar
            servers={servers}
            currentServerId={currentServer?.id}
            onServerSelect={handleServerSelect}
            onCreateServer={() => setShowCreateModal(true)}
            onJoinServer={() => setShowJoinModal(true)}
          />
        </div>

        {/* Main Container (Channel sidebar + Content) */}
        <div className={`flex-1 flex rounded-xl backdrop-blur-lg border overflow-hidden ${
          isDarkMode 
            ? 'bg-slate-800/40 border-slate-700/30' 
            : 'bg-card/40 border-border/30'
        }`}>
          {/* Channel Sidebar - Left */}
          {currentServer && (
            <div className={`w-64 border-r overflow-y-auto ${
              isDarkMode ? 'border-slate-700/30' : 'border-border/30'
            }`}>
              <ChannelSidebar
                server={currentServer}
                currentChannelId={currentChannel?.id}
                onChannelSelect={handleChannelSelect}
                onAddChannel={handleAddChannel}
              />
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {currentServer && currentChannel ? (
              ['chat','text','voice'].includes(currentChannel.type as string) ? (
                <ServerChatFeed server={currentServer} channel={currentChannel} />
              ) : (
                <ServerPostFeed server={currentServer} channel={currentChannel} />
              )
            ) : currentServer && !currentChannel ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                    <UserGroupIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to {currentServer.name}</h3>
                    <p className="text-muted-foreground">Select a channel to start reading posts and chatting with your community.</p>
                  </div>
                </div>
              </div>
            ) : servers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                    <UserGroupIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to Servers</h3>
                    <p className="text-muted-foreground mb-6">Create or join anime communities to discuss your favorite shows, share recommendations, and connect with fellow fans.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Create Server
                    </button>
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="px-6 py-3 bg-card border border-border text-foreground rounded-xl font-medium hover:bg-accent transition-all duration-300"
                    >
                      Join Server
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                    <UserGroupIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Select a Server</h3>
                    <p className="text-muted-foreground">Choose a server from the sidebar to start exploring.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onServerCreated={handleServerCreated}
        />
      )}

      {showJoinModal && (
        <JoinServerModal
          onClose={() => setShowJoinModal(false)}
          onServerJoined={handleServerJoined}
        />
      )}

      {showCreateChannelModal && currentServer && (
        <CreateChannelModal
          serverId={currentServer.id}
          defaultType={defaultChannelType}
          onClose={() => setShowCreateChannelModal(false)}
          onCreated={handleChannelCreated}
        />
      )}
    </div>
  );
} 