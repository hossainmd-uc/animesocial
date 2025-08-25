import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Find the profile by username
    const profile = await prisma.profile.findUnique({
      where: {
        username: username,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        favoriteAnime: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Include some stats for the profile view
        _count: {
          select: {
            serverPosts: true,
            serverMessages: true,
            postLikes: true,
            messageLikes: true,
            animeList: true,
          },
        },

        animeList: {
          orderBy: {
            updatedAt: 'desc',
          },
          select: {
            status: true,
            score: true,
            progress: true,
            isFavorite: true,
            anime: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                episodes: true,
                year: true,
                genres: {
                  select: {
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
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
