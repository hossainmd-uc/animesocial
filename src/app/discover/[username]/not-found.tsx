'use client';

import { useDarkMode } from '@/src/hooks/useDarkMode';
import { UserIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ProfileNotFound() {
  const { isDarkMode } = useDarkMode();

  return (
    <div className="gamer-gradient transition-colors duration-300 relative h-screen overflow-y-auto">
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
      
      {/* Main Content */}
      <div className="container mx-auto px-6 relative z-10 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
          }`}>
            <UserIcon className={`w-8 h-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
          
          <h1 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Profile Not Found
          </h1>
          
          <p className={`mb-8 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            The user profile you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
