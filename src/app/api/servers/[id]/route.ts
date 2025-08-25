import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../lib/supabase/server';

// GET /api/servers/[id] - Get server details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: serverId } = await params;
    
    const supabase = await createClient();
    const { data: { user }, error: _authError } = await supabase.auth.getUser();
    
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        channels: {
          orderBy: { position: 'asc' }
        },
        members: {
          include: {
            profile: true
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Check if current user is a member
    let isMember = false;
    let isOwner = false;
    
    if (user) {
      isMember = server.members.some(m => m.profileId === user.id);
      isOwner = server.ownerId === user.id;
    }

    const formattedServer = {
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
      channels: server.channels.map(c => ({
        id: c.id,
        server_id: c.serverId,
        name: c.name,
        description: c.description,
        type: c.type,
        position: c.position,
        is_private: c.isPrivate,
        parent_id: c.parentId,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      })),
      members: server.members.map(m => ({
        id: m.id,
        server_id: m.serverId,
        user_id: m.profileId,
        role: m.role,
        joined_at: m.joinedAt.toISOString(),
        username: m.profile.username,
        display_name: m.profile.displayName,
        avatar_url: m.profile.avatarUrl,
      })),
      is_member: isMember,
      is_owner: isOwner,
    };

    return NextResponse.json(formattedServer);
  } catch (error) {
    console.error('Error fetching server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/servers/[id] - Update server details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: serverId } = await params;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if server exists and user is owner
    const server = await prisma.server.findUnique({
      where: { id: serverId }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only server owners can update server settings' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, is_public, icon_url } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Server name is required' }, { status: 400 });
    }

    // Update the server
    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: is_public !== undefined ? is_public : server.isPublic,
        iconUrl: icon_url || server.iconUrl,
      }
    });

    const formattedServer = {
      id: updatedServer.id,
      name: updatedServer.name,
      description: updatedServer.description,
      icon_url: updatedServer.iconUrl,
      invite_code: updatedServer.inviteCode,
      is_public: updatedServer.isPublic,
      owner_id: updatedServer.ownerId,
      created_at: updatedServer.createdAt.toISOString(),
      updated_at: updatedServer.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedServer);
  } catch (error) {
    console.error('Error updating server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 