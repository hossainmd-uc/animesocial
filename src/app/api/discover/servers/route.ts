import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/discover/servers - Get public servers for discovery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause = {
      isPublic: true,
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [servers, totalCount] = await Promise.all([
      prisma.server.findMany({
        where: whereClause,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { 
              members: true,
              posts: true,
              channels: true
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.server.count({
        where: whereClause,
      }),
    ]);

    const formattedServers = servers.map((server) => ({
      id: server.id,
      name: server.name,
      description: server.description,
      iconUrl: server.iconUrl,
      inviteCode: server.inviteCode,
      memberCount: server._count.members,
      postCount: server._count.posts,
      channelCount: server._count.channels,
      owner: {
        id: server.owner.id,
        username: server.owner.username,
        displayName: server.owner.displayName,
        avatarUrl: server.owner.avatarUrl,
      },
      createdAt: server.createdAt.toISOString(),
      updatedAt: server.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      servers: formattedServers,
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error('Error fetching public servers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
