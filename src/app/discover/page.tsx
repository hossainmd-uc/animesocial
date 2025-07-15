'use client'

import Header from '@/src/components/layout/Header';
import { useDarkMode } from '@/src/hooks/useDarkMode';

export default function DiscoverPage() {
  const { isDarkMode, mounted } = useDarkMode();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto mb-8"></div>
            <div className="bg-gray-100 rounded-lg border h-64 max-w-md mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
          }`}>
            <span className="text-2xl">🌟</span>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Discover</h1>
          <p className={`mb-8 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Find new anime recommendations and trending content</p>
          
          <div className={`rounded-lg shadow-sm border p-8 max-w-md mx-auto backdrop-blur-sm transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/90 border-slate-700/50' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>Coming Soon</h2>
            <p className={`${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              This page will feature:
            </p>
            <ul className={`text-left mt-4 space-y-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <li>• Trending anime</li>
              <li>• Personalized recommendations</li>
              <li>• Popular this season</li>
              <li>• Community favorites</li>
              <li>• Top rated anime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 