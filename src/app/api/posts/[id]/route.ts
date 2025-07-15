import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../lib/supabase/server';

// GET /api/posts/[id] - Get a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: postId } = await params;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const post = await prisma.serverPost.findUnique({
      where: { id: postId },
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
        server: {
          select: {
            id: true,
            name: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true
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
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user has access to this post (is member of the server)
    if (user) {
      const isMember = await prisma.serverMember.findFirst({
        where: {
          serverId: post.serverId,
          profileId: user.id
        }
      });

      if (!isMember && !post.server) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const formattedPost = {
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
      server: {
        id: post.server.id,
        name: post.server.name,
      },
      channel: post.channel ? {
        id: post.channel.id,
        name: post.channel.name,
      } : undefined,
      like_count: post._count.likes,
      reply_count: post._count.replies,
      is_liked: user ? post.likes.length > 0 : false,
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 