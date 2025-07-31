import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { 
  extractBaseTitle, 
  determineSeriesType, 
  determineSeriesOrder,
  normalizeTitle 
} from '../src/lib/series-detection';

const prisma = new PrismaClient();

interface ImportProgress {
  currentPage: number;
  processedIds: number[];
  failedIds: number[];
  createdSeries: string[];
}

const PROGRESS_FILE = path.join(__dirname, 'enhanced-import-progress.json');
const DELAY_BETWEEN_REQUESTS = 400; // 400ms delay to respect rate limit
const TARGET_ANIME_COUNT = 50; // Target number of anime to import

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Load or initialize progress
function loadProgress(): ImportProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { currentPage: 1, processedIds: [], failedIds: [], createdSeries: [] };
}

// Save progress
function saveProgress(progress: ImportProgress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Find or create series for an anime
async function findOrCreateSeries(animeData: any): Promise<string | null> {
  try {
    const baseTitle = extractBaseTitle(animeData.title);
    const normalizedTitle = normalizeTitle(animeData.title);
    
    // First, check if we already have a series for this anime through existing relations
    const existingAnime = await prisma.anime.findMany({
      where: {
        OR: [
          { malId: { in: animeData.relations?.flatMap((rel: any) => 
            rel.entry?.filter((e: any) => e.type === 'anime').map((e: any) => e.mal_id) || []
          ) || [] }},
        ]
      },
      include: {
        series: true
      }
    });
    
    // If we find related anime that already have a series, use that series
    const relatedWithSeries = existingAnime.filter(a => a.series);
    if (relatedWithSeries.length > 0) {
      console.log(`  🔗 Found existing series for related anime: ${relatedWithSeries[0].series?.title}`);
      return relatedWithSeries[0].seriesId;
    }
    
    // Look for existing series with similar title
    const existingSeries = await prisma.animeSeries.findMany({
      where: {
        OR: [
          { title: { contains: baseTitle, mode: 'insensitive' } },
          { titleEnglish: { contains: baseTitle, mode: 'insensitive' } }
        ]
      }
    });
    
    // Check for title similarity
    for (const series of existingSeries) {
      const seriesBaseTitle = extractBaseTitle(series.title);
      if (seriesBaseTitle === baseTitle) {
        console.log(`  🔗 Found existing series: ${series.title}`);
        return series.id;
      }
    }
    
    // Create new series
    const seriesType = determineSeriesType(animeData);
    const isMainEntry = seriesType === 'main' || seriesType === 'sequel';
    
    // For series title, clean up the main anime title
    let seriesTitle = animeData.title;
    if (seriesType !== 'main') {
      // Try to extract a cleaner series title
      seriesTitle = seriesTitle.replace(/:\s*season\s*\d+/i, '');
      seriesTitle = seriesTitle.replace(/\s*season\s*\d+/i, '');
      seriesTitle = seriesTitle.replace(/\s*\d+(?:st|nd|rd|th)\s*season/i, '');
      seriesTitle = seriesTitle.replace(/\s+(II|III|IV|V|VI|VII|VIII|IX|X)$/i, '');
      seriesTitle = seriesTitle.replace(/\s*:\s*/, ': ');
      seriesTitle = seriesTitle.trim();
    }
    
    const newSeries = await prisma.animeSeries.create({
      data: {
        title: seriesTitle,
        titleEnglish: animeData.title_english,
        titleJapanese: animeData.title_japanese,
        description: animeData.synopsis,
        imageUrl: animeData.images.jpg.large_image_url,
        status: animeData.status === 'Finished Airing' ? 'completed' : 
                animeData.status === 'Currently Airing' ? 'ongoing' : 'upcoming',
        startYear: animeData.year,
        endYear: animeData.year,
        totalEpisodes: animeData.episodes,
        averageScore: animeData.score,
        popularity: animeData.popularity,
        isMainEntry
      }
    });
    
    console.log(`  ✨ Created new series: ${newSeries.title}`);
    return newSeries.id;
    
  } catch (error) {
    console.error('Error finding/creating series:', error);
    return null;
  }
}

// Import a single anime with series detection
async function importAnimeWithSeries(malId: number): Promise<boolean> {
  try {
    // Check if anime already exists
    const existingAnime = await prisma.anime.findUnique({
      where: { malId },
    });
    
    if (existingAnime) {
      console.log(`Anime with MAL ID ${malId} already exists`);
      return true;
    }

    // Fetch anime data
    const response = await axios.get(`https://api.jikan.moe/v4/anime/${malId}/full`);
    const animeData = response.data.data;

    // Find or create series for this anime
    const seriesId = await findOrCreateSeries(animeData);
    
    // Determine series-specific properties
    const seriesType = determineSeriesType(animeData);
    const seriesOrder = determineSeriesOrder(animeData, animeData.relations || []);

    // Create the anime record
    const anime = await prisma.anime.create({
      data: {
        malId: animeData.mal_id,
        seriesId,
        title: animeData.title,
        titleEnglish: animeData.title_english,
        titleJapanese: animeData.title_japanese,
        synopsis: animeData.synopsis,
        status: animeData.status,
        episodes: animeData.episodes,
        duration: animeData.duration,
        score: animeData.score,
        rank: animeData.rank,
        popularity: animeData.popularity,
        membersCount: animeData.members,
        favoritesCount: animeData.favorites,
        rating: animeData.rating,
        type: animeData.type,
        source: animeData.source,
        season: animeData.season,
        year: animeData.year,
        airedFrom: animeData.aired.from ? new Date(animeData.aired.from) : null,
        airedTo: animeData.aired.to ? new Date(animeData.aired.to) : null,
        broadcastDay: animeData.broadcast?.day || null,
        broadcastTime: animeData.broadcast?.time || null,
        broadcastTimezone: animeData.broadcast?.timezone || null,
        imageUrl: animeData.images.jpg.large_image_url,
        trailerUrl: animeData.trailer?.url || null,
        seriesType,
        seriesOrder,
      },
    });

    // Create genres (existing logic)
    if (animeData.genres) {
      for (const genreData of animeData.genres) {
        const genre = await prisma.genre.upsert({
          where: { malId: genreData.mal_id },
          create: { malId: genreData.mal_id, name: genreData.name },
          update: { name: genreData.name },
        });
        
        await prisma.animeGenres.create({
          data: { animeId: anime.id, genreId: genre.id },
        });
      }
    }

    // Create studios (existing logic)
    if (animeData.studios) {
      for (const studioData of animeData.studios) {
        const studio = await prisma.studio.upsert({
          where: { malId: studioData.mal_id },
          create: { malId: studioData.mal_id, name: studioData.name },
          update: { name: studioData.name },
        });
        
        await prisma.animeStudios.create({
          data: { animeId: anime.id, studioId: studio.id },
        });
      }
    }

    // Create producers (existing logic)
    if (animeData.producers) {
      for (const producerData of animeData.producers) {
        const producer = await prisma.producer.upsert({
          where: { malId: producerData.mal_id },
          create: { malId: producerData.mal_id, name: producerData.name },
          update: { name: producerData.name },
        });
        
        await prisma.animeProducers.create({
          data: { animeId: anime.id, producerId: producer.id },
        });
      }
    }

    // Create streaming links (existing logic)
    if (animeData.streaming) {
      for (const streamingData of animeData.streaming) {
        await prisma.animeStreaming.create({
          data: {
            animeId: anime.id,
            platformName: streamingData.name,
            url: streamingData.url,
          },
        });
      }
    }

    // Create external links (existing logic)
    if (animeData.external) {
      for (const externalData of animeData.external) {
        await prisma.animeExternalLinks.create({
          data: {
            animeId: anime.id,
            name: externalData.name,
            url: externalData.url,
          },
        });
      }
    }

    // Create relations (existing logic)
    if (animeData.relations) {
      for (const relationGroup of animeData.relations) {
        for (const entry of relationGroup.entry) {
          if (entry.type === 'anime') {
            await prisma.animeRelations.create({
              data: {
                animeId: anime.id,
                relatedMalId: entry.mal_id,
                relationType: relationGroup.relation,
              },
            });
          }
        }
      }
    }

    // Create themes (existing logic)
    if (animeData.theme) {
      // Process openings
      if (animeData.theme.openings) {
        for (const [index, opening] of animeData.theme.openings.entries()) {
          const [title, artist] = parseTheme(opening);
          await prisma.animeThemes.create({
            data: {
              animeId: anime.id,
              type: 'opening',
              number: index + 1,
              title,
              artist,
            },
          });
        }
      }

      // Process endings
      if (animeData.theme.endings) {
        for (const [index, ending] of animeData.theme.endings.entries()) {
          const [title, artist] = parseTheme(ending);
          await prisma.animeThemes.create({
            data: {
              animeId: anime.id,
              type: 'ending',
              number: index + 1,
              title,
              artist,
            },
          });
        }
      }
    }

    // Update series statistics if we created/used a series
    if (seriesId) {
      await updateSeriesStatistics(seriesId);
    }

    console.log(`Successfully imported anime: ${anime.title} (Series: ${seriesType}, Order: ${seriesOrder})`);
    return true;
    
  } catch (error) {
    console.error(`Error importing anime ${malId}:`, error);
    return false;
  }
}

// Update series statistics based on its anime
async function updateSeriesStatistics(seriesId: string) {
  try {
    const animeInSeries = await prisma.anime.findMany({
      where: { seriesId }
    });

    if (animeInSeries.length === 0) return;

    const totalEpisodes = animeInSeries.reduce((sum, a) => sum + (a.episodes || 0), 0);
    const averageScore = animeInSeries.reduce((sum, a) => sum + (a.score || 0), 0) / animeInSeries.length;
    const averagePopularity = animeInSeries.reduce((sum, a) => sum + (a.popularity || 0), 0) / animeInSeries.length;
    
    const years = animeInSeries.map(a => a.year).filter(Boolean) as number[];
    const startYear = years.length > 0 ? Math.min(...years) : null;
    const endYear = years.length > 0 ? Math.max(...years) : null;

    // Determine series status
    const hasOngoing = animeInSeries.some(a => a.status === 'Currently Airing');
    const hasCompleted = animeInSeries.some(a => a.status === 'Finished Airing');
    const status = hasOngoing ? 'ongoing' : hasCompleted ? 'completed' : 'upcoming';

    await prisma.animeSeries.update({
      where: { id: seriesId },
      data: {
        totalEpisodes,
        averageScore,
        popularity: Math.round(averagePopularity),
        startYear,
        endYear,
        status
      }
    });

  } catch (error) {
    console.error('Error updating series statistics:', error);
  }
}

// Helper function to parse theme strings (existing logic)
function parseTheme(theme: string): [string, string | null] {
  const match = theme.match(/(?:\d+: )?"([^"]+)"(?: by (.+?))?(?:\s*\(|$)/);
  if (match) {
    return [match[1], match[2] || null];
  }
  return [theme, null];
}

// Main import function
async function importAllAnimeWithSeries() {
  const progress = loadProgress();
  console.log(`🚀 Starting enhanced anime import with series detection`);
  console.log(`📊 Resuming from page ${progress.currentPage}`);

  try {
    while (true) {
      // Fetch page of top anime
      const response = await axios.get(`https://api.jikan.moe/v4/top/anime?page=${progress.currentPage}`);
      const { data, pagination } = response.data;

      console.log(`\n📄 Processing page ${progress.currentPage} of ${pagination.last_visible_page}`);

      // Process each anime on the page
      for (const anime of data) {
        // Check if we've reached our target
        if (progress.processedIds.length >= TARGET_ANIME_COUNT) {
          console.log(`\n🎯 Target of ${TARGET_ANIME_COUNT} anime reached!`);
          break;
        }

        if (!progress.processedIds.includes(anime.mal_id)) {
          await delay(DELAY_BETWEEN_REQUESTS);
          
          console.log(`\n🎬 Processing ${progress.processedIds.length + 1}/${TARGET_ANIME_COUNT}: ${anime.title} (MAL ID: ${anime.mal_id})`);
          const success = await importAnimeWithSeries(anime.mal_id);
          
          if (success) {
            progress.processedIds.push(anime.mal_id);
          } else {
            progress.failedIds.push(anime.mal_id);
          }
          
          saveProgress(progress);
        }
      }

      // Break out of the page loop if we've reached our target
      if (progress.processedIds.length >= TARGET_ANIME_COUNT) {
        break;
      }

      // Move to next page
      progress.currentPage++;
      saveProgress(progress);

      // Check if we've processed all pages
      if (progress.currentPage > pagination.last_visible_page) {
        break;
      }

      // Add delay between pages
      await delay(DELAY_BETWEEN_REQUESTS);
    }

    console.log('\n🎉 Enhanced import completed!');
    console.log(`📊 Final Statistics:`);
    console.log(`   • Processed ${progress.processedIds.length} anime successfully`);
    console.log(`   • Failed to process ${progress.failedIds.length} anime`);
    
    // Show series statistics
    const totalSeries = await prisma.animeSeries.count();
    const totalAnime = await prisma.anime.count();
    
    console.log(`   • Created ${totalSeries} series`);
    console.log(`   • Total anime in database: ${totalAnime}`);

  } catch (error) {
    console.error('❌ Error during enhanced import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Start the enhanced import
if (require.main === module) {
  importAllAnimeWithSeries().catch(console.error);
}

export { importAllAnimeWithSeries }; 