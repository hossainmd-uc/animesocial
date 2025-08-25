import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../../lib/supabase/server';

// GET /api/servers/[id]/channels - List channels for a server
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;

    const channels = await prisma.serverChannel.findMany({
      where: { serverId },
      orderBy: { position: 'asc' },
    });

    const formatted = channels.map((c: {
      id: string;
      serverId: string;
      name: string;
      description: string | null;
      type: string;
      position: number;
      isPrivate: boolean;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }) => ({
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
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/servers/[id]/channels - Create a new channel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user is server owner
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description = null, type = 'text', parent_id = null, is_private = false } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Determine next position
    const maxPos = await prisma.serverChannel.aggregate({
      _max: { position: true },
      where: { serverId },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    const channel = await prisma.serverChannel.create({
      data: {
        serverId,
        name: name.trim(),
        description,
        type,
        position,
        parentId: parent_id,
        isPrivate: is_private,
      },
    });

    const formatted = {
      id: channel.id,
      server_id: channel.serverId,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      position: channel.position,
      is_private: channel.isPrivate,
      parent_id: channel.parentId,
      created_at: channel.createdAt.toISOString(),
      updated_at: channel.updatedAt.toISOString(),
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 