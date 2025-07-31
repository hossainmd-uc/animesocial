import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../../lib/supabase/server';

// POST /api/messages/[id]/like - Like a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already liked this message
    const existingLike = await prisma.serverMessageLike.findUnique({
      where: {
        messageId_profileId: {
          messageId,
          profileId: user.id
        }
      }
    });

    if (existingLike) {
      return NextResponse.json({ error: 'Message already liked' }, { status: 400 });
    }

    // Create the like
    await prisma.serverMessageLike.create({
      data: {
        messageId,
        profileId: user.id
      }
    });

    // Get updated like count
    const likeCount = await prisma.serverMessageLike.count({
      where: { messageId }
    });

    return NextResponse.json({ 
      success: true, 
      liked: true,
      likeCount 
    });
  } catch (error) {
    console.error('Error liking message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/messages/[id]/like - Unlike a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove the like
    const deletedLike = await prisma.serverMessageLike.deleteMany({
      where: {
        messageId,
        profileId: user.id
      }
    });

    if (deletedLike.count === 0) {
      return NextResponse.json({ error: 'Like not found' }, { status: 404 });
    }

    // Get updated like count
    const likeCount = await prisma.serverMessageLike.count({
      where: { messageId }
    });

    return NextResponse.json({ 
      success: true, 
      liked: false,
      likeCount 
    });
  } catch (error) {
    console.error('Error unliking message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 