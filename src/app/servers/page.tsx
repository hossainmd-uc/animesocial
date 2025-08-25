'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import { CreateServerModal } from '../../components/servers/CreateServerModal';
import { JoinServerModal } from '../../components/servers/JoinServerModal';
import { getUserServers } from '../../lib/server-service';
import type { Server } from '../../types/server';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function ServersPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { isDarkMode, mounted } = useDarkMode();

  useEffect(() => {
    const loadAndRedirect = async () => {
      try {
        const userServers = await getUserServers();
        setServers(userServers || []);
        
        if (userServers && userServers.length > 0) {
          // Redirect to first server immediately
          router.replace(`/servers/${userServers[0].id}`);
        } else {
          // If no servers, stop loading to show the no servers state
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading servers:', error);
        setServers([]);
        setLoading(false);
      }
    };

    loadAndRedirect();
  }, [router]);

  const handleServerCreated = (newServer: Server) => {
    setShowCreateModal(false);
    router.push(`/servers/${newServer.id}`);
  };

  const handleServerJoined = (server: Server) => {
    setShowJoinModal(false);
    router.push(`/servers/${server.id}`);
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
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // No servers state
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <UserGroupIcon className={`w-24 h-24 mx-auto mb-6 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h2 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            No Servers Found
          </h2>
          <p className={`mb-8 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            You haven't joined any servers yet. Create your own or join an existing one to get started!
          </p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Server
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              Join Server
            </button>
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
    </div>
  );
}