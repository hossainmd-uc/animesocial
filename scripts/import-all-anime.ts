import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const PROGRESS_FILE = path.join(__dirname, 'import-progress.json');
const DELAY_BETWEEN_REQUESTS = 400; // 400ms delay to respect rate limit

interface Progress {
  currentPage: number;
  processedIds: number[];
  failedIds: number[];
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Load or initialize progress
function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { currentPage: 1, processedIds: [], failedIds: [] };
}

// Save progress
function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Import a single anime
async function importAnime(malId: number): Promise<boolean> {
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

    // Create the anime record
    const anime = await prisma.anime.create({
      data: {
        malId: animeData.mal_id,
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
      },
    });

    // Create genres
    if (animeData.genres) {
      for (const genreData of animeData.genres) {
        const genre = await prisma.genre.upsert({
          where: { malId: genreData.mal_id },
          create: {
            malId: genreData.mal_id,
            name: genreData.name,
          },
          update: {
            name: genreData.name,
          },
        });

        await prisma.animeGenres.create({
          data: {
            animeId: anime.id,
            genreId: genre.id,
          },
        });
      }
    }

    // Create studios
    if (animeData.studios) {
      for (const studioData of animeData.studios) {
        const studio = await prisma.studio.upsert({
          where: { malId: studioData.mal_id },
          create: {
            malId: studioData.mal_id,
            name: studioData.name,
          },
          update: {
            name: studioData.name,
          },
        });

        await prisma.animeStudios.create({
          data: {
            animeId: anime.id,
            studioId: studio.id,
          },
        });
      }
    }

    // Create producers
    if (animeData.producers) {
      for (const producerData of animeData.producers) {
        const producer = await prisma.producer.upsert({
          where: { malId: producerData.mal_id },
          create: {
            malId: producerData.mal_id,
            name: producerData.name,
          },
          update: {
            name: producerData.name,
          },
        });

        await prisma.animeProducers.create({
          data: {
            animeId: anime.id,
            producerId: producer.id,
          },
        });
      }
    }

    // Create streaming links
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

    // Create external links
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

    // Create relations
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

    // Create themes
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

    console.log(`Successfully imported anime: ${anime.title}`);
    return true;
  } catch (error) {
    console.error(`Error importing anime ${malId}:`, error);
    return false;
  }
}

// Helper function to parse theme strings
function parseTheme(theme: string): [string, string | null] {
  const match = theme.match(/(?:\d+: )?\"([^\"]+)\"(?: by (.+?))?(?:\s*\(|$)/);
  if (match) {
    return [match[1], match[2] || null];
  }
  return [theme, null];
}

// Main import function
async function importAllAnime() {
  const progress = loadProgress();
  console.log(`Resuming from page ${progress.currentPage}`);

  try {
    while (true) {
      // Fetch page of top anime
      const response = await axios.get(`https://api.jikan.moe/v4/top/anime?page=${progress.currentPage}`);
      const { data, pagination } = response.data;

      console.log(`Processing page ${progress.currentPage} of ${pagination.last_visible_page}`);

      // Process each anime on the page
      for (const anime of data) {
        if (!progress.processedIds.includes(anime.mal_id)) {
          await delay(DELAY_BETWEEN_REQUESTS);
          const success = await importAnime(anime.mal_id);
          
          if (success) {
            progress.processedIds.push(anime.mal_id);
          } else {
            progress.failedIds.push(anime.mal_id);
          }
          
          saveProgress(progress);
        }
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

    console.log('Import completed!');
    console.log(`Processed ${progress.processedIds.length} anime successfully`);
    console.log(`Failed to process ${progress.failedIds.length} anime`);

  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Start the import
importAllAnime().catch(console.error); 