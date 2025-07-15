import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../../lib/supabase/server';

// GET /api/posts/[id]/replies - Get replies for a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: postId } = await params;
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // First check if the parent post exists
    const parentPost = await prisma.serverPost.findUnique({
      where: { id: postId },
      include: {
        server: true
      }
    });

    if (!parentPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user has access to this post (is member of the server)
    if (user) {
      const isMember = await prisma.serverMember.findFirst({
        where: {
          serverId: parentPost.serverId,
          profileId: user.id
        }
      });

      if (!isMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const replies = await prisma.serverPost.findMany({
      where: {
        parentId: postId
      },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        anime: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        likes: user ? {
          where: {
            profileId: user.id
          }
        } : false,
        _count: {
          select: {
            likes: true,
            replies: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: limit,
      skip: offset
    });

    const formattedReplies = replies.map((reply: any) => ({
      id: reply.id,
      server_id: reply.serverId,
      channel_id: reply.channelId,
      author_id: reply.authorId,
      title: reply.title,
      content: reply.content,
      image_url: reply.imageUrl,
      anime_id: reply.animeId,
      parent_id: reply.parentId,
      created_at: reply.createdAt.toISOString(),
      updated_at: reply.updatedAt.toISOString(),
      author: {
        username: reply.author.username,
        display_name: reply.author.displayName,
        avatar_url: reply.author.avatarUrl,
      },
      anime: reply.anime ? {
        id: reply.anime.id,
        title: reply.anime.title,
        image_url: reply.anime.imageUrl,
      } : undefined,
      like_count: reply._count.likes,
      reply_count: reply._count.replies,
      is_liked: user ? reply.likes.length > 0 : false,
    }));

    return NextResponse.json(formattedReplies);
  } catch (error) {
    console.error('Error fetching post replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 