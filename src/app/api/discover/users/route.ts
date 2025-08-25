import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/discover/users - Search users for discovery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!search.trim()) {
      // If no search term, return recent users
      const users = await prisma.profile.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              animeList: true,
              serverPosts: true,
              ownedServers: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const totalCount = await prisma.profile.count();

      return NextResponse.json({
        users,
        totalCount,
        hasMore: offset + limit < totalCount,
      });
    }

    const whereClause = {
      OR: [
        {
          username: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          displayName: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          bio: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
      ],
    };

    const [users, totalCount] = await Promise.all([
      prisma.profile.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              animeList: true,
              serverPosts: true,
              ownedServers: true,
            },
          },
        },
        orderBy: [
          { username: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.profile.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      users,
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
