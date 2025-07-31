import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { ActivityService } from '@/src/lib/activity-service';

// GET /api/user/activities
export async function GET(request: Request) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const activities = await ActivityService.getUserActivities(user.id, limit);

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 