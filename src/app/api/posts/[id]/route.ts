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

// PUT /api/posts/[id] - Update a specific post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: postId } = await params;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, image_url, anime_id } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check if post exists and user is the author
    const existingPost = await prisma.serverPost.findUnique({
      where: { id: postId },
      include: {
        server: true
      }
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden - You can only edit your own posts' }, { status: 403 });
    }

    // Check if user is still a member of the server
    const isMember = await prisma.serverMember.findFirst({
      where: {
        serverId: existingPost.serverId,
        profileId: user.id
      }
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Access denied - You are not a member of this server' }, { status: 403 });
    }

    // Update the post
    const updatedPost = await prisma.serverPost.update({
      where: { id: postId },
      data: {
        title: title || null,
        content: content.trim(),
        imageUrl: image_url || null,
        animeId: anime_id || null,
        updatedAt: new Date()
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
        _count: {
          select: {
            likes: true,
            replies: true
          }
        }
      }
    });

    const formattedPost = {
      id: updatedPost.id,
      server_id: updatedPost.serverId,
      channel_id: updatedPost.channelId,
      author_id: updatedPost.authorId,
      title: updatedPost.title,
      content: updatedPost.content,
      image_url: updatedPost.imageUrl,
      anime_id: updatedPost.animeId,
      parent_id: updatedPost.parentId,
      created_at: updatedPost.createdAt.toISOString(),
      updated_at: updatedPost.updatedAt.toISOString(),
      author: {
        username: updatedPost.author.username,
        display_name: updatedPost.author.displayName,
        avatar_url: updatedPost.author.avatarUrl,
      },
      anime: updatedPost.anime ? {
        id: updatedPost.anime.id,
        title: updatedPost.anime.title,
        image_url: updatedPost.anime.imageUrl,
      } : undefined,
      server: {
        id: updatedPost.server.id,
        name: updatedPost.server.name,
      },
      channel: updatedPost.channel ? {
        id: updatedPost.channel.id,
        name: updatedPost.channel.name,
      } : undefined,
      like_count: updatedPost._count.likes,
      reply_count: updatedPost._count.replies,
      is_liked: false, // Will be recalculated on next fetch
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/posts/[id] - Delete a specific post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: postId } = await params;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if post exists and user is the author
    const existingPost = await prisma.serverPost.findUnique({
      where: { id: postId },
      include: {
        server: true,
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden - You can only delete your own posts' }, { status: 403 });
    }

    // Check if user is still a member of the server (or server owner can delete any post)
    const membership = await prisma.serverMember.findFirst({
      where: {
        serverId: existingPost.serverId,
        profileId: user.id
      }
    });

    const isServerOwner = existingPost.server.ownerId === user.id;

    if (!membership && !isServerOwner) {
      return NextResponse.json({ error: 'Access denied - You are not a member of this server' }, { status: 403 });
    }

    // Delete all likes for this post first (cascade delete)
    await prisma.serverPostLike.deleteMany({
      where: { postId: postId }
    });

    // Delete all replies to this post recursively
    await deletePostAndReplies(postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to recursively delete a post and all its replies
async function deletePostAndReplies(postId: string) {
  // Find all direct replies to this post
  const replies = await prisma.serverPost.findMany({
    where: { parentId: postId },
    select: { id: true }
  });

  // Recursively delete all replies
  for (const reply of replies) {
    await deletePostAndReplies(reply.id);
  }

  // Delete likes for this post
  await prisma.serverPostLike.deleteMany({
    where: { postId: postId }
  });

  // Delete the post itself
  await prisma.serverPost.delete({
    where: { id: postId }
  });
} 