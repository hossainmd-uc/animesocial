import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: seriesId } = await params;

    const series = await prisma.animeSeries.findUnique({
      where: { id: seriesId },
      include: {
        animes: {
          include: {
            genres: {
              include: {
                genre: true
              }
            },
            streaming: true,
            externalLinks: true
          },
          orderBy: { seriesOrder: 'asc' }
        }
      }
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: series.id,
      title: series.title,
      titleEnglish: series.titleEnglish,
      titleJapanese: series.titleJapanese,
      description: series.description,
      imageUrl: series.imageUrl || series.animes[0]?.imageUrl,
      status: series.status,
      startYear: series.startYear,
      endYear: series.endYear,
      totalEpisodes: series.totalEpisodes,
      averageScore: series.averageScore,
      popularity: series.popularity,
      animes: series.animes.map((anime: any) => ({
        id: anime.id,
        title: anime.title,
        titleEnglish: anime.titleEnglish,
        synopsis: anime.synopsis,
        status: anime.status,
        episodes: anime.episodes,
        score: anime.score,
        year: anime.year,
        type: anime.type,
        seriesType: anime.seriesType,
        seriesOrder: anime.seriesOrder,
        imageUrl: anime.imageUrl,
        trailerUrl: anime.trailerUrl,
        genres: anime.genres.map((g: any) => ({
          id: g.genre.id,
          name: g.genre.name
        })),
        streaming: anime.streaming.map((s: any) => ({
          name: s.platformName,
          url: s.url
        })),
        externalLinks: anime.externalLinks.map((l: any) => ({
          name: l.name,
          url: l.url
        }))
      }))
    });

  } catch (error) {
    console.error('Error fetching series details:', error);
    return NextResponse.json({ error: 'Failed to fetch series details' }, { status: 500 });
  }
} 