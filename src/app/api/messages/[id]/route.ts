import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../lib/supabase/server';

// Helper to format message with author info the same way other endpoints do
function formatMessage(m: any) {
  return {
    id: m.id,
    channel_id: m.channelId,
    author_id: m.authorId,
    content: m.content,
    parent_id: m.parentId || null,
    created_at: m.createdAt.toISOString(),
    updated_at: m.updatedAt.toISOString(),
    author: {
      username: m.author?.username,
      avatar_url: m.author?.avatarUrl,
    },
    like_count: 0, // TODO: Count likes
    reply_count: 0, // TODO: Count replies
    is_liked: false // TODO: Check if current user liked
  };
}

// GET /api/messages/[id] - Get a single message with author details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;

    const message = await prisma.serverMessage.findUnique({
      where: { id: messageId },
      include: {
        author: {
          select: { username: true, avatarUrl: true }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(formatMessage(message));
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/messages/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const existing = await prisma.serverMessage.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (existing.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.serverMessage.update({
      where: { id },
      data: { content: content.trim() },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(formatMessage(updated));
  } catch (err) {
    console.error('Error updating message', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/messages/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.serverMessage.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (existing.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.serverMessage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting message', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 