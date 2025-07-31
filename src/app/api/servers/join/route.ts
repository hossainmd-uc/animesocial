import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../lib/supabase/server';

// POST /api/servers/join - Join a server using invite code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invite_code } = body;

    if (!invite_code?.trim()) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Find server by invite code
    const server = await prisma.server.findUnique({
      where: { inviteCode: invite_code.trim() }
    });

    if (!server) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.serverMember.findUnique({
      where: {
        serverId_profileId: {
          serverId: server.id,
          profileId: user.id
        }
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this server' }, { status: 409 });
    }

    // Add user to server_members table
    await prisma.serverMember.create({
      data: {
        serverId: server.id,
        profileId: user.id,
        role: 'member'
      }
    });

    // Return success response with server details
    const formattedServer = {
      id: server.id,
      name: server.name,
      description: server.description,
      icon_url: server.iconUrl,
      invite_code: server.inviteCode,
      is_public: server.isPublic,
      owner_id: server.ownerId,
      created_at: server.createdAt.toISOString(),
      updated_at: server.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, server: formattedServer }, { status: 200 });
  } catch (error) {
    console.error('Error joining server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 