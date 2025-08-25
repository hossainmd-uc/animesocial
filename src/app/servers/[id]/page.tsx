'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/layout/Header';
import { ServerSidebar } from '../../../components/servers/ServerSidebar';
import { ChannelSidebar } from '../../../components/servers/ChannelSidebar';
import { ServerPostFeed } from '../../../components/servers/ServerPostFeed';
import ServerChatFeed from '../../../components/servers/ServerChatFeed';
import { CreateServerModal } from '../../../components/servers/CreateServerModal';
import { JoinServerModal } from '../../../components/servers/JoinServerModal';
import CreateChannelModal from '../../../components/servers/CreateChannelModal';
import { getUserServers, getServer } from '../../../lib/server-service';
import type { Server, ServerWithDetails, ServerChannel } from '../../../types/server';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../../hooks/useDarkMode';

interface ServerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ServerPage({ params }: ServerPageProps) {
  const [serverId, setServerId] = useState<string | null>(null);
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

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setServerId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Load user's servers
  useEffect(() => {
    loadUserServers();
  }, []);

  // Load the specific server from params
  useEffect(() => {
    if (serverId) {
      handleServerSelect(serverId);
    }
  }, [serverId]);

  // Set default channel when server loads
  useEffect(() => {
    if (currentServer?.channels && currentServer.channels.length > 0 && !currentChannel) {
      const defaultChannel = currentServer.channels.find(c => c.name === 'general') || currentServer.channels[0];
      setCurrentChannel(defaultChannel);
    }
  }, [currentServer]);

  const loadUserServers = async () => {
    try {
      const userServers = await getUserServers();
      setServers(userServers || []);
    } catch (error) {
      console.error('Error loading servers:', error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServerSelect = async (serverId: string) => {
    try {
      const server = await getServer(serverId);
      setCurrentServer(server);
      setCurrentChannel(null); // Reset channel selection
      
      // Update URL without causing a page reload
      router.replace(`/servers/${serverId}`);
    } catch (error) {
      console.error('Error loading server:', error);
      // If server not found or user doesn't have access, redirect to servers list
      router.push('/servers');
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

  if (!mounted) {
    return (
      <div className="h-screen bg-gray-900 animate-pulse">
        <Header />
        <div className="flex h-[calc(100vh-64px)]">
          <div className="w-64 bg-gray-800"></div>
          <div className="flex-1 bg-gray-700"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has access to this server
  const hasServerAccess = serverId && (servers.some(s => s.id === serverId) || currentServer);

  if (!hasServerAccess && !loading) {
    return (
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <UserGroupIcon className={`w-16 h-16 mx-auto mb-4 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h2 className={`text-xl font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Server Not Found
            </h2>
            <p className={`mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              You don't have access to this server or it doesn't exist.
            </p>
            <button
              onClick={() => router.push('/servers')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Servers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gamer-gradient transition-colors duration-300 relative h-screen overflow-hidden">
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
      
      <Header />
      
      <div className="flex h-[calc(100vh-64px)] relative z-10">
        {/* Server Sidebar */}
        <div className={`w-16 transition-all duration-300 backdrop-blur-xl border-r ${
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

        {currentServer ? (
          <>
            {/* Channel Sidebar */}
            <div className={`w-64 transition-all duration-300 backdrop-blur-xl border-r ${
              isDarkMode 
                ? 'bg-slate-800/60 border-slate-700/30' 
                : 'bg-card/60 border-border/30'
            }`}>
              <ChannelSidebar
                server={currentServer}
                currentChannelId={currentChannel?.id}
                onChannelSelect={handleChannelSelect}
                onAddChannel={handleAddChannel}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {currentChannel ? (
                currentChannel.type === 'text' || currentChannel.type === 'chat' ? (
                  <ServerChatFeed
                    serverId={currentServer.id}
                    channelId={currentChannel.id}
                    channelName={currentChannel.name}
                  />
                ) : (
                  <ServerPostFeed
                    serverId={currentServer.id}
                    channelId={currentChannel.id}
                    channelName={currentChannel.name}
                  />
                )
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className={`text-xl font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Welcome to {currentServer.name}
                    </h2>
                    <p className={`${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Select a channel to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <UserGroupIcon className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h2 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Loading Server...
              </h2>
            </div>
          </div>
        )}
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

      {currentServer && showCreateChannelModal && (
        <CreateChannelModal
          serverId={currentServer.id}
          onClose={() => setShowCreateChannelModal(false)}
          onCreated={handleChannelCreated}
          defaultType={defaultChannelType}
        />
      )}
    </div>
  );
}
