import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { ProfileService } from '@/src/lib/profile-service';

// PATCH /api/user/profile
export async function PATCH(request: Request) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('PATCH /api/user/profile: No authenticated user');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestBody = await request.json();
    console.log('PATCH /api/user/profile: Request body:', requestBody);
    console.log('PATCH /api/user/profile: User ID:', user.id);

    const { displayName, bio, favoriteAnime, avatarUrl, status } = requestBody;

    const profileData = {
      id: user.id,
      displayName,
      bio,
      favoriteAnime,
      avatarUrl,
      status,
    };

    console.log('PATCH /api/user/profile: Profile data to upsert:', profileData);

    const updatedProfile = await ProfileService.upsertProfile(profileData);

    console.log('PATCH /api/user/profile: Successfully updated profile:', updatedProfile);
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('PATCH /api/user/profile: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 