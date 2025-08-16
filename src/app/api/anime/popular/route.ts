import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { retryDb } from '@/src/lib/db-retry';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Popular anime API called - checking database...');
    
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;

    // Get top anime by popularity (using a combination of score, members, and rank)
    const popularAnime = await retryDb(() => prisma.anime.findMany({
      where: {
        score: {
          gte: 7.0 // Only include anime with decent scores
        },
        membersCount: {
          gte: 10000 // Only include anime with decent member count
        }
      },
      select: {
        id: true,
        title: true,
        titleEnglish: true,
        imageUrl: true,
        score: true,
        rank: true,
        popularity: true,
        membersCount: true,
        favoritesCount: true,
      },
      orderBy: [
        { membersCount: 'desc' }, // Primary: most members
        { score: 'desc' },        // Secondary: highest score
        { favoritesCount: 'desc' } // Tertiary: most favorites
      ],
      take: limit,
    }));

    // Format the response
    const formattedAnime = popularAnime.map(anime => ({
      id: anime.id,
      title: anime.titleEnglish || anime.title,
      imageUrl: anime.imageUrl,
      score: anime.score,
      rank: anime.rank,
      popularity: anime.popularity,
      membersCount: anime.membersCount,
      favoritesCount: anime.favoritesCount,
    }));

    console.log(`✅ Found ${formattedAnime.length} popular anime`);
    return NextResponse.json(formattedAnime);
  } catch (error) {
    console.error('Error fetching popular anime:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular anime' },
      { status: 500 }
    );
  }
}
