'use client'

import Header from '@/src/components/layout/Header';
import { useDarkMode } from '@/src/hooks/useDarkMode';

export default function AnimesPage() {
  const { isDarkMode, mounted } = useDarkMode();

  if (!mounted) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h1 className={`text-4xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Browse Anime
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Coming soon...
          </p>
        </div>
      </main>
    </div>
  );
} 