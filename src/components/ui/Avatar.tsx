import React from 'react';
import Image from 'next/image';
import { useDarkMode } from '../../hooks/useDarkMode';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  username?: string;
  className?: string;
  showOnline?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl'
};

const generateGradientAvatar = (username: string): string => {
  // Generate a consistent gradient based on username
  const gradients = [
    'bg-gradient-to-br from-red-400 to-red-600',
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-green-400 to-green-600',
    'bg-gradient-to-br from-yellow-400 to-yellow-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'bg-gradient-to-br from-teal-400 to-teal-600',
    'bg-gradient-to-br from-orange-400 to-orange-600',
    'bg-gradient-to-br from-cyan-400 to-cyan-600',
    'bg-gradient-to-br from-emerald-400 to-emerald-600',
    'bg-gradient-to-br from-violet-400 to-violet-600'
  ];
  
  // Ensure we have a fallback username
  const cleanUsername = (username || 'User').trim();
  
  let hash = 0;
  for (let i = 0; i < cleanUsername.length; i++) {
    hash = cleanUsername.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return gradients[Math.abs(hash) % gradients.length];
};

const getInitials = (username: string): string => {
  const cleanUsername = (username || 'User').trim();
  
  // Split by spaces and take first letter of each word
  const words = cleanUsername.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return 'U';
  } else if (words.length === 1) {
    // If single word, take first 2 characters
    return words[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple words, take first letter of first 2 words
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  }
};

export default function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  username = 'User', 
  className = '',
  showOnline = false 
}: AvatarProps) {
  const { isDarkMode } = useDarkMode();
  const sizeClass = sizeClasses[size];
  const initials = getInitials(username);
  const gradientClass = generateGradientAvatar(username);

  const baseClasses = `${sizeClass} rounded-full flex items-center justify-center font-semibold text-white shadow-lg relative ${className}`;

  // Only render image if src is a valid non-empty string
  if (src && src.trim() !== '') {
    return (
      <div className={`${baseClasses} overflow-hidden ring-2 ${isDarkMode ? 'ring-slate-700' : 'ring-gray-200'}`}>
        <Image
          src={src}
          alt={alt || `${username}'s avatar`}
          fill
          className="object-cover"
          sizes={`${sizeClasses[size].split(' ')[0].substring(2)}px`}
          onError={(e) => {
            // If image fails to load, hide it and show default avatar
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        {showOnline && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 rounded-full ${
            isDarkMode ? 'border-slate-800' : 'border-white'
          }`} />
        )}
      </div>
    );
  }

  // Default avatar with user initials and gradient background
  return (
    <div className={`${baseClasses} ${gradientClass} ring-2 ${isDarkMode ? 'ring-slate-700' : 'ring-gray-200'}`}>
      <span className="drop-shadow-sm">{initials}</span>
      {showOnline && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 rounded-full ${
          isDarkMode ? 'border-slate-800' : 'border-white'
        }`} />
      )}
    </div>
  );
} 