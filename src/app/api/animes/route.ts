import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET /api/animes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {};

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleEnglish: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Add type filter
    if (type && type !== 'all') {
      where.type = type;
    }

    const animes = await Promise.race([
      prisma.anime.findMany({
        where,
        select: {
          id: true,
          malId: true,
          title: true,
          titleEnglish: true,
          synopsis: true,
          episodes: true,
          score: true,
          year: true,
          status: true,
          imageUrl: true,
          type: true,
          rating: true,
        },
        orderBy: {
          score: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))
    ]) as any[];

    return NextResponse.json(animes);
  } catch (error) {
    console.error('Error fetching animes:', error);
    // Return empty array instead of error when database is unreachable
    return NextResponse.json([]);
  }
} 