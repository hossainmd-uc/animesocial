import { PrismaClient } from '@prisma/client';
import { detectSeries, determineSeriesType, determineSeriesOrder } from '../src/lib/series-detection';

const prisma = new PrismaClient();

async function organizeAnimeIntoSeries() {
  console.log('🚀 Starting anime series organization...');
  
  try {
    // First, detect all series candidates
    const seriesCandidates = await detectSeries();
    
    console.log(`\n📊 Found ${seriesCandidates.length} series to create\n`);
    
    let createdSeries = 0;
    let updatedAnime = 0;
    
    for (const candidate of seriesCandidates) {
      console.log(`📺 Processing series: "${candidate.mainTitle}"`);
      
      // Create the series record
      const series = await prisma.animeSeries.create({
        data: {
          title: candidate.mainTitle,
          description: `A series containing ${candidate.animeIds.length} related anime entries`,
          imageUrl: candidate.imageUrl,
          status: 'ongoing', // We'll update this based on anime status
          startYear: candidate.startYear,
          endYear: candidate.endYear,
          totalEpisodes: candidate.totalEpisodes,
          averageScore: candidate.averageScore,
          popularity: 0, // Will be calculated from anime
          isMainEntry: true
        }
      });
      
      createdSeries++;
      console.log(`  ✅ Created series with ID: ${series.id}`);
      
      // Update all anime in this series
      const animeInSeries = await prisma.anime.findMany({
        where: {
          id: { in: candidate.animeIds }
        },
        include: {
          relations: true
        }
      });
      
      // Calculate series status and popularity
      let totalPopularity = 0;
      let hasOngoing = false;
      let hasCompleted = false;
      
      for (const anime of animeInSeries) {
        const seriesType = determineSeriesType(anime);
        const seriesOrder = determineSeriesOrder(anime, anime.relations);
        
        // Update anime with series information
        await prisma.anime.update({
          where: { id: anime.id },
          data: {
            seriesId: series.id,
            seriesType,
            seriesOrder
          }
        });
        
        updatedAnime++;
        
        // Track status and popularity
        if (anime.popularity) totalPopularity += anime.popularity;
        if (anime.status === 'Currently Airing') hasOngoing = true;
        if (anime.status === 'Finished Airing') hasCompleted = true;
        
        console.log(`    📌 Updated anime: "${anime.title}" (Type: ${seriesType}, Order: ${seriesOrder})`);
      }
      
      // Update series status and average popularity
      const averagePopularity = animeInSeries.length > 0 ? totalPopularity / animeInSeries.length : 0;
      let seriesStatus = 'completed';
      if (hasOngoing) seriesStatus = 'ongoing';
      else if (!hasCompleted) seriesStatus = 'upcoming';
      
      await prisma.animeSeries.update({
        where: { id: series.id },
        data: {
          status: seriesStatus,
          popularity: Math.round(averagePopularity)
        }
      });
      
      console.log(`  📊 Series "${candidate.mainTitle}" complete (${animeInSeries.length} anime, Status: ${seriesStatus})\n`);
    }
    
    // Handle standalone anime (create series for them too)
    console.log('🔍 Finding standalone anime...');
    const standaloneAnime = await prisma.anime.findMany({
      where: {
        seriesId: null
      }
    });
    
    console.log(`📌 Found ${standaloneAnime.length} standalone anime`);
    
    for (const anime of standaloneAnime) {
      // Create individual series for standalone anime
      const series = await prisma.animeSeries.create({
        data: {
          title: anime.title,
          titleEnglish: anime.titleEnglish,
          titleJapanese: anime.titleJapanese,
          description: anime.synopsis,
          imageUrl: anime.imageUrl,
          status: anime.status === 'Finished Airing' ? 'completed' : 
                  anime.status === 'Currently Airing' ? 'ongoing' : 'upcoming',
          startYear: anime.year,
          endYear: anime.year,
          totalEpisodes: anime.episodes,
          averageScore: anime.score,
          popularity: anime.popularity,
          isMainEntry: true
        }
      });
      
      await prisma.anime.update({
        where: { id: anime.id },
        data: {
          seriesId: series.id,
          seriesType: 'main',
          seriesOrder: 1
        }
      });
      
      createdSeries++;
      updatedAnime++;
    }
    
    console.log(`\n🎉 Organization complete!`);
    console.log(`📊 Statistics:`);
    console.log(`   • Created ${createdSeries} series`);
    console.log(`   • Updated ${updatedAnime} anime entries`);
    console.log(`   • Processed ${seriesCandidates.length} multi-anime series`);
    console.log(`   • Processed ${standaloneAnime.length} standalone anime\n`);
    
    // Verify the results
    const totalSeries = await prisma.animeSeries.count();
    const totalAnime = await prisma.anime.count();
    const linkedAnime = await prisma.anime.count({ where: { seriesId: { not: null } } });
    
    console.log(`✅ Verification:`);
    console.log(`   • Total series in database: ${totalSeries}`);
    console.log(`   • Total anime in database: ${totalAnime}`);
    console.log(`   • Anime linked to series: ${linkedAnime}`);
    console.log(`   • Unlinked anime: ${totalAnime - linkedAnime}`);
    
  } catch (error) {
    console.error('❌ Error during organization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the organization
if (require.main === module) {
  organizeAnimeIntoSeries().catch(console.error);
}

export { organizeAnimeIntoSeries }; 