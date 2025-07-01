import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { prisma } from '@/src/lib/prisma';
import { ProfileService } from '@/src/lib/profile-service';

// GET /api/user/anime-list
export async function GET() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userAnimeList = await prisma.userAnimeList.findMany({
      where: {
        profileId: user.id,
      },
      include: {
        anime: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            episodes: true,
          },
        },
      },
    });

    return NextResponse.json(userAnimeList);
  } catch (error) {
    console.error('Error fetching user anime list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/user/anime-list
export async function POST(request: Request) {
  console.log('🚀 POST /api/user/anime-list called');
  
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  console.log('👤 User from auth:', user ? { id: user.id, email: user.email } : 'No user');
  
  if (!user) {
    console.log('❌ No user found, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestBody = await request.json();
    console.log('📤 Request body:', requestBody);
    
    const { animeId, isFavorite = false } = requestBody;
    console.log('📝 Parsed data:', { animeId, isFavorite });

    // Ensure profile exists using ProfileService
    console.log('🔍 Ensuring profile exists...');
    const profile = await ProfileService.ensureProfile(
      user.id, 
      user.email || undefined, 
      user.user_metadata
    );
    console.log('✅ Profile ensured:', profile);

    // Check if entry already exists
    console.log('🔍 Checking for existing entry...');
    const existingEntry = await prisma.userAnimeList.findUnique({
      where: {
        profileId_animeId: {
          profileId: user.id,
          animeId: animeId,
        },
      },
      include: {
        anime: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            episodes: true,
          },
        },
      },
    });

    if (existingEntry) {
      console.log('📝 Entry already exists, returning existing:', existingEntry);
      return NextResponse.json(existingEntry);
    }

    console.log('🔍 Creating user anime entry...');
    const userAnime = await prisma.userAnimeList.create({
      data: {
        profileId: user.id,
        animeId,
        status: 'plan_to_watch',
        isFavorite,
      },
      include: {
        anime: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            episodes: true,
          },
        },
      },
    });

    console.log('✅ Successfully created user anime:', userAnime);
    return NextResponse.json(userAnime);
  } catch (error) {
    console.error('❌ Error adding anime to list:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// PATCH /api/user/anime-list
export async function PATCH(request: Request) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status, progress, isFavorite } = await request.json();

    // Build update data object with only provided fields
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const userAnime = await prisma.userAnimeList.update({
      where: {
        id,
        profileId: user.id, // Ensure user owns this record
      },
      data: updateData,
      include: {
        anime: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            episodes: true,
          },
        },
      },
    });

    return NextResponse.json(userAnime);
  } catch (error) {
    console.error('Error updating anime in list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/user/anime-list
export async function DELETE(request: Request) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    await prisma.userAnimeList.delete({
      where: {
        id,
        profileId: user.id, // Ensure user owns this record
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing anime from list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 