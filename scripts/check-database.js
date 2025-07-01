const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 CHECKING DATABASE STATUS\n');
    
    // Check anime count
    const animeCount = await prisma.anime.count();
    console.log(`📺 Total anime in database: ${animeCount}`);
    
    if (animeCount > 0) {
      // Get some sample anime
      const sampleAnime = await prisma.anime.findMany({
        take: 5,
        select: {
          id: true,
          malId: true,
          title: true,
          titleEnglish: true,
          episodes: true,
          score: true,
          year: true,
          status: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('\n📋 Recently added anime:');
      sampleAnime.forEach((anime, index) => {
        console.log(`${index + 1}. ${anime.title} (${anime.titleEnglish || 'N/A'})`);
        console.log(`   MAL ID: ${anime.malId} | Episodes: ${anime.episodes || 'Unknown'} | Score: ${anime.score || 'N/A'} | Year: ${anime.year || 'N/A'}`);
        console.log(`   Status: ${anime.status}`);
        console.log('');
      });
    }
    
    // Check related data
    const genreCount = await prisma.genre.count();
    const studioCount = await prisma.studio.count();
    const userListCount = await prisma.userAnimeList.count();
    
    console.log('📊 Related data:');
    console.log(`   Genres: ${genreCount}`);
    console.log(`   Studios: ${studioCount}`);
    console.log(`   User anime list entries: ${userListCount}`);
    
    // Check if UserAnimeList table works
    console.log('\n🔧 Testing UserAnimeList functionality...');
    const userListTest = await prisma.userAnimeList.findMany({
      take: 3,
      include: {
        anime: {
          select: {
            title: true,
            malId: true
          }
        }
      }
    });
    
    if (userListTest.length > 0) {
      console.log('✅ UserAnimeList table working correctly');
      console.log('📝 Sample user list entries:');
      userListTest.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.anime.title} - Status: ${entry.status}`);
      });
    } else {
      console.log('ℹ️  No user anime list entries found (this is normal for a fresh setup)');
    }
    
    console.log('\n✅ Database check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 