import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { ActivityService } from '@/src/lib/activity-service';
import { prisma } from '@/lib/prisma';

// GET /api/user/activities?username=someuser (optional)
export async function GET(request: Request) {
  const supabase = await createClient();
  
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const limit = parseInt(searchParams.get('limit') || '10');

  // If no username provided, require authentication for current user's activities
  if (!username) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const activities = await ActivityService.getUserActivities(user.id, limit);
      return NextResponse.json(activities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  // If username provided, get activities for that specific user (public access)
  try {
    // First, find the user by username
    const profile = await prisma.profile.findUnique({
      where: {
        username: username,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const activities = await ActivityService.getUserActivities(profile.id, limit);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 