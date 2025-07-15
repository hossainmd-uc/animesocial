import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../../../../lib/supabase/server';

// POST /api/servers/[id]/channels/[channelId]/posts - Create a new post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: serverId, channelId } = await params;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, image_url, anime_id, parent_id } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Create the post using Prisma ORM
    const post = await prisma.serverPost.create({
      data: {
        serverId: serverId,
        channelId: channelId,
        authorId: user.id,
        title: title || null,
        content: content.trim(),
        imageUrl: image_url || null,
        animeId: anime_id || null,
        parentId: parent_id || null,
      },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        anime: anime_id ? {
          select: {
            id: true,
            title: true,
            imageUrl: true
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
      like_count: post._count.likes,
      reply_count: post._count.replies,
      is_liked: false,
    };

    return NextResponse.json(formattedPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 