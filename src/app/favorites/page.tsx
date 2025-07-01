'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to watchlist page with favorites tab active
    router.replace('/watchlist?tab=favorites');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
} 