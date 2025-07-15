import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../../lib/supabase/server';

// POST /api/posts/[id]/like - Toggle like on a post
export async function POST(
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

    // Check if post exists
    const post = await prisma.serverPost.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already liked using Prisma ORM
    const existingLike = await prisma.serverPostLike.findUnique({
      where: {
        postId_profileId: {
          postId: postId,
          profileId: user.id
        }
      }
    });

    if (existingLike) {
      // Unlike - delete the like
      await prisma.serverPostLike.delete({
        where: {
          postId_profileId: {
            postId: postId,
            profileId: user.id
          }
        }
      });
    } else {
      // Like - create new like
      await prisma.serverPostLike.create({
        data: {
          postId: postId,
          profileId: user.id
        }
      });
    }

    // Get updated like count
    const likeCount = await prisma.serverPostLike.count({
      where: { postId: postId }
    });

    return NextResponse.json({ 
      success: true, 
      liked: !existingLike,
      likeCount: likeCount
    });
  } catch (error) {
    console.error('Error toggling post like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 