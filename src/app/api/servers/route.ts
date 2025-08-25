import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../lib/supabase/server';

// Helper function to generate invite codes
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// GET /api/servers - Get user's servers
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const servers = await Promise.race([
      prisma.server.findMany({
        where: {
          members: {
            some: {
              profileId: user.id
            }
          }
        },
        include: {
          _count: {
            select: { members: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]) as Array<{
      id: string;
      name: string;
      description: string | null;
      iconUrl: string | null;
      inviteCode: string | null;
      isPublic: boolean;
      ownerId: string;
      createdAt: Date;
      updatedAt: Date;
      _count: { members: number };
    }>;

    const formattedServers = servers.map((server) => ({
      id: server.id,
      name: server.name,
      description: server.description,
      icon_url: server.iconUrl,
      invite_code: server.inviteCode,
      is_public: server.isPublic,
      owner_id: server.ownerId,
      member_count: server._count.members,
      created_at: server.createdAt.toISOString(),
      updated_at: server.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedServers);
  } catch (error) {
    console.error('Error fetching user servers:', error);
    // Return empty array instead of error when database is unreachable
    return NextResponse.json([]);
  }
}

// POST /api/servers - Create a new server
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon_url, is_public } = body;

    const inviteCode = generateInviteCode();

    const server = await Promise.race([
      prisma.server.create({
        data: {
          name,
          description,
          iconUrl: icon_url,
          isPublic: is_public ?? true,
          ownerId: user.id,
          inviteCode,
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]) as {
      id: string;
      name: string;
      description: string | null;
      iconUrl: string | null;
      isPublic: boolean;
      ownerId: string;
      inviteCode: string | null;
      createdAt: Date;
      updatedAt: Date;
    };

    // Create default channels
    const defaultChannels = [
      { name: 'general', description: 'General discussion', type: 'text', position: 0 },
      { name: 'anime-talk', description: 'Discuss your favorite anime', type: 'text', position: 1 },
      { name: 'recommendations', description: 'Share anime recommendations', type: 'text', position: 2 },
    ];

    await Promise.race([
      prisma.serverChannel.createMany({
        data: defaultChannels.map(channel => ({
          ...channel,
          serverId: server.id,
        }))
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]);

    // Add creator as owner member
    await Promise.race([
      prisma.serverMember.create({
        data: {
          serverId: server.id,
          profileId: user.id,
          role: 'owner',
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]);

    const formattedServer = {
      id: server.id,
      name: server.name,
      description: server.description,
      icon_url: server.iconUrl,
      invite_code: server.inviteCode,
      is_public: server.isPublic,
      owner_id: server.ownerId,
      member_count: 1,
      created_at: server.createdAt.toISOString(),
      updated_at: server.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedServer, { status: 201 });
  } catch (error) {
    console.error('Error creating server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 