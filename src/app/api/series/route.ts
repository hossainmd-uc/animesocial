import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { retryDb } from '../../../lib/db-retry';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Series API called - checking database...');
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleEnglish: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Check if we have any AnimeSeries data
    const seriesCount = await retryDb(() => prisma.animeSeries.count());
    console.log(`📊 Found ${seriesCount} total series in database`);

    if (seriesCount === 0) {
      console.log('⚠️ No series found, falling back to grouped anime approach');
      
      // Fallback: Group individual anime by title similarity
      const animes = await prisma.anime.findMany({
        where: search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { titleEnglish: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        select: {
          id: true,
          title: true,
          titleEnglish: true,
          synopsis: true,
          episodes: true,
          imageUrl: true,
          status: true,
          score: true,
          year: true,
          season: true,
          type: true,
          source: true,
          studios: {
            select: {
              studio: {
                select: {
                  name: true,
                  id: true
                }
              }
            }
          },
          genres: {
            select: {
              genre: {
                select: {
                  name: true,
                  id: true
                }
              }
            }
          },
          themes: true,
        },
        take: limit,
        skip: skip,
        orderBy: search ? [
          { score: 'desc' },
          { title: 'asc' }
        ] : [
          { score: 'desc' },
          { year: 'desc' }
        ]
      });

      // Convert individual anime to series format
      const animeAsSeries = animes.map(anime => ({
        id: anime.id,
        title: anime.title,
        titleEnglish: anime.titleEnglish,
        description: anime.synopsis,
        imageUrl: anime.imageUrl,
        status: anime.status,
        startYear: anime.year,
        endYear: anime.year,
        totalEpisodes: anime.episodes,
        averageScore: anime.score,
        animeCount: 1,
        animes: [anime]
      }));

      const totalAnime = await retryDb(() => prisma.anime.count());
      const totalPages = Math.ceil(totalAnime / limit);

      return NextResponse.json({
        series: animeAsSeries,
        pagination: {
          current: page,
          total: totalPages,
          count: totalAnime,
          limit
        }
      });
    }

    // Fetch real AnimeSeries with associated anime
    const series = await retryDb(() => prisma.animeSeries.findMany({
      where: whereClause,
      include: {
        animes: {
          select: {
            id: true,
            title: true,
            titleEnglish: true,
            episodes: true,
            score: true,
            year: true,
            type: true,
            seriesType: true,
            seriesOrder: true,
            imageUrl: true,
            status: true,
            synopsis: true,
            genres: {
              select: {
                genre: {
                  select: {
                    name: true,
                    id: true
                  }
                }
              }
            }
          },
          orderBy: { seriesOrder: 'asc' }
        },
        _count: {
          select: { animes: true }
        }
      },
      orderBy: { title: 'asc' },
      skip,
      take: limit
    }));

    // Get total count for pagination
    const totalCount = await retryDb(() => prisma.animeSeries.count({ where: whereClause }));
    const totalPages = Math.ceil(totalCount / limit);

    console.log(`✅ Found ${series.length} real series (page ${page}/${totalPages})`);

    return NextResponse.json({
      series: series.map(s => ({
        id: s.id,
        title: s.title,
        titleEnglish: s.titleEnglish,
        titleJapanese: s.titleJapanese,
        description: s.description,
        imageUrl: s.imageUrl || s.animes[0]?.imageUrl,
        status: s.status,
        startYear: s.startYear,
        endYear: s.endYear,
        totalEpisodes: s.totalEpisodes,
        averageScore: s.averageScore,
        popularity: s.popularity,
        animeCount: s._count.animes,
        animes: s.animes
      })),
      pagination: {
        current: page,
        total: totalPages,
        count: totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
} 