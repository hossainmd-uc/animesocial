import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const prisma = new PrismaClient();
const PROGRESS_FILE = path.join(__dirname, 'import-progress.json');
const DELAY_BETWEEN_REQUESTS = 500; // 500ms delay to be safe with rate limits

interface Progress {
  currentPage: number;
  processedIds: number[];
  failedIds: number[];
  totalPages?: number;
  startTime?: string;
  lastUpdateTime?: string;
  mode?: 'test' | 'full';
}

interface ImportStats {
  totalProcessed: number;
  totalFailed: number;
  currentPage: number;
  totalPages: number;
  percentComplete: number;
  timeElapsed: string;
  estimatedTimeRemaining: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Load or initialize progress
function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { 
    currentPage: 1, 
    processedIds: [], 
    failedIds: [],
    mode: 'test'
  };
}

// Save progress
function saveProgress(progress: Progress) {
  progress.lastUpdateTime = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Get import statistics
function getImportStats(progress: Progress): ImportStats {
  const now = new Date();
  const startTime = progress.startTime ? new Date(progress.startTime) : now;
  const timeElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  
  const hours = Math.floor(timeElapsed / 3600);
  const minutes = Math.floor((timeElapsed % 3600) / 60);
  const seconds = timeElapsed % 60;
  const timeElapsedStr = `${hours}h ${minutes}m ${seconds}s`;
  
  const percentComplete = progress.totalPages ? 
    Math.round((progress.currentPage / progress.totalPages) * 100) : 0;
    
  const estimatedTimeRemaining = progress.totalPages && progress.currentPage > 1 ? 
    Math.round((timeElapsed / progress.currentPage) * (progress.totalPages - progress.currentPage)) : 0;
    
  const estimatedHours = Math.floor(estimatedTimeRemaining / 3600);
  const estimatedMinutes = Math.floor((estimatedTimeRemaining % 3600) / 60);
  const estimatedTimeRemainingStr = `${estimatedHours}h ${estimatedMinutes}m`;

  return {
    totalProcessed: progress.processedIds.length,
    totalFailed: progress.failedIds.length,
    currentPage: progress.currentPage,
    totalPages: progress.totalPages || 0,
    percentComplete,
    timeElapsed: timeElapsedStr,
    estimatedTimeRemaining: estimatedTimeRemainingStr
  };
}

// Display current status
function displayStatus(progress: Progress) {
  console.clear();
  console.log('🎌 ANIME IMPORT MANAGER 🎌');
  console.log('================================');
  
  if (progress.processedIds.length === 0 && progress.currentPage === 1) {
    console.log('📊 Status: Ready to start');
    console.log('📁 Mode: Not set');
  } else {
    const stats = getImportStats(progress);
    console.log(`📊 Status: ${progress.currentPage > 1 ? 'In Progress' : 'Ready to Resume'}`);
    console.log(`📁 Mode: ${progress.mode || 'unknown'}`);
    console.log(`📄 Page: ${stats.currentPage}${stats.totalPages ? ` / ${stats.totalPages}` : ''}`);
    console.log(`✅ Processed: ${stats.totalProcessed} anime`);
    console.log(`❌ Failed: ${stats.totalFailed} anime`);
    console.log(`📈 Progress: ${stats.percentComplete}%`);
    console.log(`⏱️  Elapsed: ${stats.timeElapsed}`);
    if (stats.totalPages > 0) {
      console.log(`⏰ Estimated remaining: ${stats.estimatedTimeRemaining}`);
    }
  }
  
  console.log('================================');
}

// Import a single anime (same logic as before but with better error handling)
async function importAnime(malId: number): Promise<boolean> {
  try {
    const existingAnime = await prisma.anime.findUnique({
      where: { malId },
    });

    if (existingAnime) {
      console.log(`⚠️  Anime ${malId} already exists, skipping...`);
      return true;
    }

    console.log(`🔄 Importing anime ${malId}...`);
    const response = await axios.get(`https://api.jikan.moe/v4/anime/${malId}/full`);
    const animeData = response.data.data;

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

    // Import related data (genres, studios, etc.) - simplified for space
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

    console.log(`✅ Successfully imported: ${anime.title}`);
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`❌ Anime ${malId} not found (404), skipping...`);
      return true; // Don't count 404s as failures
    }
    console.error(`❌ Error importing anime ${malId}:`, error.message);
    return false;
  }
}

// Interactive menu
async function showMenu(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n🎯 Choose an action:');
    console.log('1. 🧪 Test Import (10 anime)');
    console.log('2. 🚀 Start Full Import');
    console.log('3. ▶️  Resume Import');
    console.log('4. 📊 Show Status');
    console.log('5. 🔄 Reset Progress');
    console.log('6. ❌ Exit');
    console.log('');
    
    rl.question('Enter your choice (1-6): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Test import function
async function testImport() {
  console.log('🧪 Starting test import (10 anime)...\n');
  
  const progress = loadProgress();
  progress.mode = 'test';
  progress.startTime = new Date().toISOString();
  
  const testIds = [1, 5, 16, 20, 30, 11, 12, 13, 14, 15]; // Popular anime IDs
  
  for (let i = 0; i < testIds.length; i++) {
    const malId = testIds[i];
    console.log(`\n📦 Processing ${i + 1}/${testIds.length}: MAL ID ${malId}`);
    
    if (!progress.processedIds.includes(malId)) {
      await delay(DELAY_BETWEEN_REQUESTS);
      const success = await importAnime(malId);
      
      if (success) {
        progress.processedIds.push(malId);
      } else {
        progress.failedIds.push(malId);
      }
      
      saveProgress(progress);
    }
  }
  
  console.log('\n🎉 Test import completed!');
  console.log(`✅ Successfully imported: ${progress.processedIds.length} anime`);
  console.log(`❌ Failed to import: ${progress.failedIds.length} anime`);
}

// Full import function
async function fullImport() {
  console.log('🚀 Starting full import...\n');
  
  const progress = loadProgress();
  progress.mode = 'full';
  if (!progress.startTime) {
    progress.startTime = new Date().toISOString();
  }

  try {
    // Get total pages if we don't have it
    if (!progress.totalPages) {
      console.log('📊 Getting total page count...');
      const response = await axios.get('https://api.jikan.moe/v4/top/anime?page=1');
      progress.totalPages = response.data.pagination.last_visible_page;
      saveProgress(progress);
      console.log(`📄 Total pages to process: ${progress.totalPages}\n`);
    }

    while (progress.currentPage <= (progress.totalPages || 1)) {
      console.log(`\n📄 Processing page ${progress.currentPage}/${progress.totalPages}...`);
      
      const response = await axios.get(`https://api.jikan.moe/v4/top/anime?page=${progress.currentPage}`);
      const { data } = response.data;

      for (let i = 0; i < data.length; i++) {
        const anime = data[i];
        console.log(`\n📦 Processing ${i + 1}/${data.length} on page ${progress.currentPage}: ${anime.title}`);
        
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

      progress.currentPage++;
      saveProgress(progress);
      
      // Show progress every page
      const stats = getImportStats(progress);
      console.log(`\n📈 Progress: ${stats.percentComplete}% | Processed: ${stats.totalProcessed} | Failed: ${stats.totalFailed}`);
      
      await delay(DELAY_BETWEEN_REQUESTS);
    }

    console.log('\n🎉 Full import completed!');
  } catch (error) {
    console.error('\n❌ Error during import:', error);
    throw error;
  }
}

// Reset progress
function resetProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
  console.log('🔄 Progress has been reset!');
}

// Main function
async function main() {
  try {
    while (true) {
      const progress = loadProgress();
      displayStatus(progress);
      
      const choice = await showMenu();
      
      switch (choice) {
        case '1':
          await testImport();
          break;
        case '2':
          await fullImport();
          break;
        case '3':
          if (progress.processedIds.length > 0 || progress.currentPage > 1) {
            if (progress.mode === 'test') {
              await testImport();
            } else {
              await fullImport();
            }
          } else {
            console.log('❌ No import to resume. Start a new import first.');
          }
          break;
        case '4':
          // Status is already displayed
          break;
        case '5':
          resetProgress();
          break;
        case '6':
          console.log('👋 Goodbye!');
          return;
        default:
          console.log('❌ Invalid choice. Please try again.');
      }
      
      if (choice !== '4' && choice !== '6') {
        console.log('\nPress Enter to continue...');
        await new Promise(resolve => {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          rl.question('', () => {
            rl.close();
            resolve(void 0);
          });
        });
      }
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Start the application
if (require.main === module) {
  main().catch(console.error);
} 