const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const DELAY_BETWEEN_REQUESTS = 500; // 500ms to be safe with rate limits

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Clean title for series name
function cleanTitleForSeries(title) {
  return title
    .replace(/:\s*Season\s*\d+/gi, '')
    .replace(/\s*Season\s*\d+/gi, '')
    .replace(/\s*\d+(?:st|nd|rd|th)?\s*Season/gi, '')
    .replace(/:\s*Part\s*\d+/gi, '')
    .replace(/\s*Part\s*\d+/gi, '')
    .replace(/\s+(II|III|IV|V|VI|VII|VIII|IX|X)$/gi, '')
    .replace(/\s+\d+$/, '')
    .replace(/:\s*Final\s*Season?/gi, '')
    .replace(/:\s*The\s*Final\s*Season?/gi, '')
    .replace(/\s*:\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Determine series type
function determineSeriesType(anime) {
  const title = anime.title.toLowerCase();
  const type = anime.type?.toLowerCase();
  
  if (type === 'movie') return 'movie';
  if (type === 'ova') return 'ova';
  if (type === 'special') return 'special';
  
  const relations = anime.relations || [];
  const hasPrequel = relations.some(r => r.relation === 'Prequel');
  const hasSequel = relations.some(r => r.relation === 'Sequel');
  
  if (hasPrequel && hasSequel) return 'sequel';
  if (hasPrequel && !hasSequel) return 'sequel';
  if (!hasPrequel && hasSequel) return 'main';
  
  if (title.includes('season') || title.includes('sequel')) return 'sequel';
  
  return 'main';
}

// Determine series order
function determineSeriesOrder(anime) {
  const title = anime.title.toLowerCase();
  
  // Extract season number
  const seasonMatch = title.match(/season\s*(\d+)/);
  if (seasonMatch) return parseInt(seasonMatch[1]);
  
  // Extract trailing number
  const numMatch = title.match(/\s+(\d+)$/);
  if (numMatch) return parseInt(numMatch[1]);
  
  // Use year as fallback
  return anime.year || 1;
}

// Find or create series for anime
async function findOrCreateSeries(animeData) {
  try {
    console.log(`  🔍 Looking for series for: ${animeData.title}`);
    
    // Step 1: Check if any related anime already exist
    const relatedMalIds = [];
    
    if (animeData.relations) {
      for (const relationGroup of animeData.relations) {
        if (['Sequel', 'Prequel', 'Side story'].includes(relationGroup.relation)) {
          for (const entry of relationGroup.entry) {
            if (entry.type === 'anime') {
              relatedMalIds.push(entry.mal_id);
            }
          }
        }
      }
    }
    
    if (relatedMalIds.length > 0) {
      const existingAnime = await prisma.anime.findMany({
        where: { malId: { in: relatedMalIds } },
        include: { series: true }
      });
      
      const withSeries = existingAnime.find(a => a.seriesId);
      if (withSeries) {
        console.log(`    ✅ Found existing series: ${withSeries.series?.title}`);
        return withSeries.seriesId;
      }
    }
    
    // Step 2: Create new series
    const seriesTitle = animeData.title_english || animeData.title;
    const cleanedTitle = cleanTitleForSeries(seriesTitle);
    
    const newSeries = await prisma.animeSeries.create({
      data: {
        title: cleanedTitle,
        titleEnglish: animeData.title_english,
        titleJapanese: animeData.title_japanese,
        description: animeData.synopsis,
        imageUrl: animeData.images?.jpg?.large_image_url,
        status: animeData.status === 'Finished Airing' ? 'completed' : 
                animeData.status === 'Currently Airing' ? 'ongoing' : 'upcoming',
        startYear: animeData.year,
        endYear: animeData.year,
        totalEpisodes: animeData.episodes,
        averageScore: animeData.score,
        popularity: animeData.popularity,
        isMainEntry: true
      }
    });
    
    console.log(`    ✨ Created new series: ${newSeries.title}`);
    return newSeries.id;
    
  } catch (error) {
    console.error('    ❌ Error with series:', error);
    return null;
  }
}

// Import a single anime
async function importAnime(malId) {
  try {
    // Check if already exists
    const existing = await prisma.anime.findUnique({ where: { malId } });
    if (existing) {
      console.log(`  ⏭️  Anime ${malId} already exists`);
      return true;
    }

    console.log(`🎬 Fetching anime ${malId}...`);
    const response = await axios.get(`https://api.jikan.moe/v4/anime/${malId}/full`);
    const animeData = response.data.data;

    // Find or create series
    const seriesId = await findOrCreateSeries(animeData);
    const seriesType = determineSeriesType(animeData);
    const seriesOrder = determineSeriesOrder(animeData);

    // Create anime
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
        airedFrom: animeData.aired?.from ? new Date(animeData.aired.from) : null,
        airedTo: animeData.aired?.to ? new Date(animeData.aired.to) : null,
        broadcastDay: animeData.broadcast?.day || null,
        broadcastTime: animeData.broadcast?.time || null,
        broadcastTimezone: animeData.broadcast?.timezone || null,
        imageUrl: animeData.images?.jpg?.large_image_url,
        trailerUrl: animeData.trailer?.url || null,
        seriesType,
        seriesOrder,
      },
    });

    console.log(`  ✅ Imported: ${anime.title} (${seriesType}, order: ${seriesOrder})`);
    return true;

  } catch (error) {
    console.error(`  ❌ Failed to import ${malId}:`, error);
    return false;
  }
}

// Main import function
async function import100Anime() {
  console.log('🚀 Starting import of 100 anime with series detection...\n');

  try {
    let imported = 0;
    let failed = 0;
    let totalProcessed = 0;
    const targetCount = 100;

    // Get anime in pages (API default is 25 per page)
    for (let page = 1; page <= 4 && totalProcessed < targetCount; page++) {
      console.log(`📄 Fetching page ${page}...`);
      const response = await axios.get(`https://api.jikan.moe/v4/top/anime?page=${page}`);
      const animeList = response.data.data;

      console.log(`📊 Found ${animeList.length} anime on page ${page}\n`);

      for (let i = 0; i < animeList.length && totalProcessed < targetCount; i++) {
        const anime = animeList[i];
        totalProcessed++;
        console.log(`\n[${totalProcessed}/${targetCount}] Processing: ${anime.title}`);
        
        const success = await importAnime(anime.mal_id);
        if (success) {
          imported++;
        } else {
          failed++;
        }

        // Delay between requests
        await delay(DELAY_BETWEEN_REQUESTS);
      }

      // Delay between pages
      if (page < 4 && totalProcessed < targetCount) {
        console.log(`\n⏳ Page ${page} complete, waiting before next page...`);
        await delay(1000); // 1 second between pages
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`📊 Results:`);
    console.log(`   ✅ Imported: ${imported} anime`);
    console.log(`   ❌ Failed: ${failed} anime`);

    // Show series statistics
    const totalSeries = await prisma.animeSeries.count();
    const totalAnime = await prisma.anime.count();
    const linkedAnime = await prisma.anime.count({ where: { seriesId: { not: null } } });

    console.log(`\n📺 Series Statistics:`);
    console.log(`   • Total series created: ${totalSeries}`);
    console.log(`   • Total anime in database: ${totalAnime}`);
    console.log(`   • Anime linked to series: ${linkedAnime}`);
    console.log(`   • Standalone anime: ${totalAnime - linkedAnime}`);

    // Show some example series
    const exampleSeries = await prisma.animeSeries.findMany({
      take: 5,
      include: {
        animes: {
          select: { title: true, seriesType: true, seriesOrder: true }
        }
      }
    });

    console.log(`\n📺 Example Series Created:`);
    for (const series of exampleSeries) {
      console.log(`🎬 ${series.title} (${series.animes.length} entries)`);
      for (const anime of series.animes.sort((a, b) => a.seriesOrder - b.seriesOrder)) {
        console.log(`   └── ${anime.title} (${anime.seriesType}, order: ${anime.seriesOrder})`);
      }
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
import100Anime().catch(console.error); 