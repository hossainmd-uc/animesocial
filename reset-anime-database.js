const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAnimeDatabase() {
  console.log('🗑️  Resetting anime database...\n');
  
  try {
    // Delete all anime-related data in the correct order (due to foreign key constraints)
    
    console.log('Deleting anime themes...');
    const deletedThemes = await prisma.animeThemes.deleteMany({});
    console.log(`   ✅ Deleted ${deletedThemes.count} anime themes`);
    
    console.log('Deleting anime external links...');
    const deletedLinks = await prisma.animeExternalLinks.deleteMany({});
    console.log(`   ✅ Deleted ${deletedLinks.count} external links`);
    
    console.log('Deleting anime streaming...');
    const deletedStreaming = await prisma.animeStreaming.deleteMany({});
    console.log(`   ✅ Deleted ${deletedStreaming.count} streaming entries`);
    
    console.log('Deleting anime relations...');
    const deletedRelations = await prisma.animeRelations.deleteMany({});
    console.log(`   ✅ Deleted ${deletedRelations.count} relations`);
    
    console.log('Deleting anime producers...');
    const deletedProducers = await prisma.animeProducers.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProducers.count} anime-producer connections`);
    
    console.log('Deleting anime studios...');
    const deletedStudios = await prisma.animeStudios.deleteMany({});
    console.log(`   ✅ Deleted ${deletedStudios.count} anime-studio connections`);
    
    console.log('Deleting anime genres...');
    const deletedGenres = await prisma.animeGenres.deleteMany({});
    console.log(`   ✅ Deleted ${deletedGenres.count} anime-genre connections`);
    
    console.log('Deleting user anime lists...');
    const deletedUserLists = await prisma.userAnimeList.deleteMany({});
    console.log(`   ✅ Deleted ${deletedUserLists.count} user list entries`);
    
    console.log('Deleting server posts...');
    const deletedPosts = await prisma.serverPost.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPosts.count} server posts`);
    
    console.log('Deleting activity logs...');
    const deletedLogs = await prisma.activityLog.deleteMany({});
    console.log(`   ✅ Deleted ${deletedLogs.count} activity logs`);
    
    console.log('Deleting anime...');
    const deletedAnime = await prisma.anime.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAnime.count} anime entries`);
    
    console.log('Deleting anime series...');
    const deletedSeries = await prisma.animeSeries.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSeries.count} anime series`);
    
    console.log('Deleting producers...');
    const deletedProducerEntities = await prisma.producer.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProducerEntities.count} producers`);
    
    console.log('Deleting studios...');
    const deletedStudioEntities = await prisma.studio.deleteMany({});
    console.log(`   ✅ Deleted ${deletedStudioEntities.count} studios`);
    
    console.log('Deleting genres...');
    const deletedGenreEntities = await prisma.genre.deleteMany({});
    console.log(`   ✅ Deleted ${deletedGenreEntities.count} genres`);
    
    console.log('\n🧹 Clearing import progress...');
    const fs = require('fs');
    const path = require('path');
    
    const progressFiles = [
      path.join(__dirname, 'scripts', 'enhanced-import-progress.json'),
      path.join(__dirname, 'dist', 'scripts', 'enhanced-import-progress.json')
    ];
    
    let deletedProgressFiles = 0;
    for (const file of progressFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          deletedProgressFiles++;
          console.log(`   ✅ Deleted ${file}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not delete ${file}`);
      }
    }
    
    console.log(`   ✅ Cleared ${deletedProgressFiles} progress files`);
    
    console.log('\n🎉 Complete database and progress reset finished!');
    console.log('📊 All anime, series, related data, and import progress have been cleared');
    console.log('🚀 Ready to start fresh import from page 1');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAnimeDatabase();
