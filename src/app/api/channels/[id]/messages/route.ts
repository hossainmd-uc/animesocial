import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../../lib/supabase/server';

// GET /api/channels/[id]/messages?limit=&before=
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 50);
    const before = searchParams.get('before');

    const where: any = { channelId };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.serverMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: {
          select: { username: true, avatarUrl: true }
        }
      }
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      channel_id: m.channelId,
      author_id: m.authorId,
      content: m.content,
      created_at: m.createdAt.toISOString(),
      updated_at: m.updatedAt.toISOString(),
      author: {
        username: m.author?.username,
        avatar_url: m.author?.avatarUrl,
      },
    })).reverse();

    return NextResponse.json(formatted);
  } catch (err) {
    console.error('Error fetching messages', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/channels/[id]/messages
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const message = await prisma.serverMessage.create({
      data: {
        channelId,
        authorId: user.id,
        content: content.trim(),
      },
      include: {
        author: { select: { username: true, avatarUrl: true } }
      }
    });

    const formatted = {
      id: message.id,
      channel_id: message.channelId,
      author_id: message.authorId,
      content: message.content,
      created_at: message.createdAt.toISOString(),
      updated_at: message.updatedAt.toISOString(),
      author: {
        username: message.author?.username,
        avatar_url: message.author?.avatarUrl,
      },
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (err) {
    console.error('Error creating message', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 