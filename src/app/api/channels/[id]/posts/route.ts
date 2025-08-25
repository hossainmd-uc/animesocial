import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../../lib/supabase/server';

// GET /api/channels/[id]/posts - Get posts from a channel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Await params as required by Next.js 15
    const { id: channelId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use Prisma ORM instead of raw SQL
    const posts = await prisma.serverPost.findMany({
      where: {
        channelId: channelId,
        parentId: null
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
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const formattedPosts = posts.map((post: {
      id: string;
      serverId: string;
      channelId: string;
      authorId: string;
      title: string;
      content: string;
      imageUrl: string | null;
      animeId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }) => ({
      id: post.id,
      server_id: post.serverId,
      channel_id: post.channelId,
      author_id: post.authorId,
      title: post.title,
      content: post.content,
      image_url: post.imageUrl,
      anime_id: post.animeId,
      parent_id: post.parentId,
      created_at: post.createdAt.toISOString(),
      updated_at: post.updatedAt.toISOString(),
      author: {
        username: post.author.username,
        display_name: post.author.displayName,
        avatar_url: post.author.avatarUrl,
      },
      anime: post.anime ? {
        id: post.anime.id,
        title: post.anime.title,
        image_url: post.anime.imageUrl,
      } : undefined,
      like_count: post._count.likes,
      reply_count: post._count.replies,
      is_liked: user ? post.likes.length > 0 : false,
      replies: []
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 