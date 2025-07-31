import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '../../../../../lib/supabase/server';

// Helper function to generate invite codes
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// POST /api/servers/[id]/regenerate-invite - Regenerate server invite code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: serverId } = await params;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if server exists and user is owner
    const server = await prisma.server.findUnique({
      where: { id: serverId }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only server owners can regenerate invite codes' }, { status: 403 });
    }

    // Generate new invite code
    const newInviteCode = generateInviteCode();

    // Update the server with new invite code
    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: {
        inviteCode: newInviteCode
      }
    });

    return NextResponse.json({ 
      success: true, 
      invite_code: updatedServer.inviteCode 
    }, { status: 200 });
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 