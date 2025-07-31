import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { prisma } from '@/src/lib/prisma';
import { ProfileService } from '@/src/lib/profile-service';
import { ActivityService } from '@/src/lib/activity-service';

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
    const userAnimeList = await Promise.race([
      prisma.userAnimeList.findMany({
        where: {
          profileId: user.id,
        },
        include: {
          anime: {
            include: {
              genres: {
                include: {
                  genre: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]);

    return NextResponse.json(userAnimeList);
  } catch (error) {
    console.error('Error fetching user anime list:', error);
    
    // Return empty array if database is down
    console.log('⚠️ Database unreachable, returning empty user anime list');
    return NextResponse.json([]);
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

    // Ensure profile exists using ProfileService with timeout
    console.log('🔍 Ensuring profile exists...');
    const profile = await Promise.race([
      ProfileService.ensureProfile(
        user.id, 
        user.email || undefined, 
        user.user_metadata
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 15000))
    ]);
    console.log('✅ Profile ensured:', profile);

    // Check if entry already exists with timeout
    console.log('🔍 Checking for existing entry...');
    const existingEntry = await Promise.race([
      prisma.userAnimeList.findUnique({
        where: {
          profileId_animeId: {
            profileId: user.id,
            animeId: animeId,
          },
        },
        include: {
          anime: true,
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]);

    if (existingEntry) {
      console.log('📝 Entry already exists, returning existing:', existingEntry);
      return NextResponse.json(existingEntry);
    }

    console.log('🔍 Creating user anime entry...');
    const userAnime = await Promise.race([
      prisma.userAnimeList.create({
        data: {
          profileId: user.id,
          animeId,
          status: 'plan_to_watch',
          isFavorite,
        },
        include: {
          anime: true,
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]);

    // Log activity for adding anime to list
    if (userAnime && typeof userAnime === 'object' && 'anime' in userAnime) {
      const animeData = userAnime as any;
      await ActivityService.logAnimeAdded(
        user.id,
        animeId,
        animeData.anime?.title || 'Unknown Anime',
        'plan_to_watch',
        isFavorite
      );
    }

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
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`🔧 PATCH /api/user/anime-list [${requestId}] - Start`);
  
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status, progress, isFavorite } = await request.json();
    console.log(`🔧 PATCH [${requestId}] - Request data:`, { id, status, progress, isFavorite });

    // Get the current anime data to access episode count with timeout
    const currentEntry = await Promise.race([
      prisma.userAnimeList.findUnique({
        where: {
          id,
          profileId: user.id,
        },
        include: {
          anime: true,
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]);

    if (!currentEntry || typeof currentEntry !== 'object' || !('anime' in currentEntry)) {
      return NextResponse.json({ error: 'Anime entry not found' }, { status: 404 });
    }

    // Type assertion for currentEntry
    const entry = currentEntry as {
      id: string;
      status: string;
      anime: {
        id: string;
        title: string;
        imageUrl: string;
        episodes: number | null;
      };
    };

    // Build update data object with only provided fields
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    // Auto-adjust progress based on status changes
    if (status !== undefined && progress === undefined) {
      if (status === 'completed' && entry.anime.episodes) {
        // When marking as completed, set progress to total episodes
        updateData.progress = entry.anime.episodes;
      } else if (status === 'plan_to_watch') {
        // When marking as plan to watch, reset progress to 0
        updateData.progress = 0;
      }
      // For other statuses (watching, dropped), keep current progress
    }

    // Auto-adjust status based on progress changes
    if (progress !== undefined && status === undefined) {
      if (entry.status === 'completed' && progress < (entry.anime.episodes || 0)) {
        // If currently completed but progress is set below total episodes, change to watching
        updateData.status = 'watching';
      } else if (progress === (entry.anime.episodes || 0) && entry.status === 'watching') {
        // If progress equals total episodes and currently watching, mark as completed
        updateData.status = 'completed';
      }
    }

    const userAnime = await Promise.race([
      prisma.userAnimeList.update({
        where: {
          id,
          profileId: user.id, // Ensure user owns this record
        },
        data: updateData,
        include: {
          anime: true,
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]);

    // Log activities based on what was updated
    if (userAnime && typeof userAnime === 'object' && 'anime' in userAnime) {
      const animeData = userAnime as any;
      const animeTitle = animeData.anime?.title || 'Unknown Anime';
      
      // Track what we've logged to avoid duplicates
      const loggedActivities = new Set<string>();

      // Log completion (this takes priority over other activities)
      const isCompletion = updateData.status === 'completed' && entry.status !== 'completed';
      if (isCompletion) {
        await ActivityService.logAnimeCompleted(
          user.id,
          animeData.animeId,
          animeTitle,
          animeData.score,
          animeData.anime?.episodes
        );
        loggedActivities.add('completion');
        loggedActivities.add('progress'); // Don't log progress separately for completion
      }
      
      // Log status change (if not completion, as that's handled above)
      else if (updateData.status && updateData.status !== entry.status) {
        await ActivityService.logStatusChange(
          user.id,
          animeData.animeId,
          animeTitle,
          entry.status,
          updateData.status
        );
        loggedActivities.add('status');
      }

      // Log score update
      if (updateData.score !== undefined && updateData.score !== (entry as any).score) {
        await ActivityService.logScoreUpdate(
          user.id,
          animeData.animeId,
          animeTitle,
          (entry as any).score,
          updateData.score
        );
        loggedActivities.add('score');
      }

      // Log progress update (only if we haven't already logged completion)
      if (updateData.progress !== undefined && 
          updateData.progress !== (entry as any).progress && 
          !loggedActivities.has('progress')) {
        await ActivityService.logProgressUpdate(
          user.id,
          animeData.animeId,
          animeTitle,
          (entry as any).progress || 0,
          updateData.progress,
          animeData.anime?.episodes
        );
      }

      // Log favorite change
      if (updateData.isFavorite !== undefined && updateData.isFavorite !== (entry as any).isFavorite) {
        await ActivityService.logFavoriteChange(
          user.id,
          animeData.animeId,
          animeTitle,
          updateData.isFavorite
        );
      }
    }

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

    // Get the entry before deletion for logging
    const entryToDelete = await prisma.userAnimeList.findUnique({
      where: {
        id,
        profileId: user.id,
      },
      include: {
        anime: true,
      },
    });

    await prisma.userAnimeList.delete({
      where: {
        id,
        profileId: user.id, // Ensure user owns this record
      },
    });

    // Log the removal activity
    if (entryToDelete) {
      await ActivityService.logAnimeRemoved(
        user.id,
        entryToDelete.animeId || '',
        entryToDelete.anime?.title || 'Unknown Anime',
        entryToDelete.status
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing anime from list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 