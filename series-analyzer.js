const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Extract core words from a title for similarity detection
function extractCoreWords(title) {
  return title
    .toLowerCase()
    .replace(/[°':!?.,()-]/g, ' ') // Remove special characters
    .replace(/\b(the|and|or|of|in|on|at|to|for|with|by)\b/g, ' ') // Remove common words
    .split(/\s+/)
    .filter(word => word.length > 2) // Keep words longer than 2 characters
    .filter(word => !['season', 'part', 'final', 'new', 'movie', 'ova', 'special', 'episode'].includes(word)); // Remove anime-specific words
}

// Calculate similarity between two titles based on shared core words
function calculateSimilarity(title1, title2) {
  const words1 = extractCoreWords(title1);
  const words2 = extractCoreWords(title2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const sharedWords = words1.filter(word => words2.includes(word));
  const maxWords = Math.max(words1.length, words2.length);
  
  return sharedWords.length / maxWords;
}

// Ask user to choose between options
function askUser(question, options) {
  return new Promise((resolve) => {
    console.log(`\n${question}`);
    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option}`);
    });
    console.log(`${options.length + 1}. Skip this group (leave as separate series)`);
    
    rl.question('\nEnter your choice (number): ', (answer) => {
      const choice = parseInt(answer) - 1;
      if (choice >= 0 && choice < options.length) {
        resolve(options[choice]);
      } else {
        resolve(null); // Skip
      }
    });
  });
}

async function analyzeSeries() {
  console.log('🔍 Analyzing anime series organization...\n');
  
  try {
    // Get all series with their anime
    const allSeries = await prisma.animeSeries.findMany({
      include: {
        animes: {
          select: {
            id: true,
            title: true,
            titleEnglish: true,
            year: true,
            episodes: true,
            type: true,
            seriesType: true
          },
          orderBy: { year: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${allSeries.length} series to analyze`);
    
    // Group potentially related series
    const processed = new Set();
    const similarGroups = [];
    
    for (let i = 0; i < allSeries.length; i++) {
      if (processed.has(i)) continue;
      
      const currentSeries = allSeries[i];
      const relatedSeries = [currentSeries];
      processed.add(i);
      
      // Find other series with similar names
      for (let j = i + 1; j < allSeries.length; j++) {
        if (processed.has(j)) continue;
        
        const otherSeries = allSeries[j];
        const similarity = calculateSimilarity(currentSeries.title, otherSeries.title);
        
        if (similarity > 0.5) { // 50% similarity threshold
          relatedSeries.push(otherSeries);
          processed.add(j);
        }
      }
      
      if (relatedSeries.length > 1) {
        similarGroups.push(relatedSeries);
      }
    }
    
    console.log(`\nFound ${similarGroups.length} groups of potentially related series:\n`);
    
    // Present each group to the user
    for (let i = 0; i < similarGroups.length; i++) {
      const group = similarGroups[i];
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`GROUP ${i + 1}: Related Series Detected`);
      console.log(`${'='.repeat(60)}`);
      
      // Show all series in the group
      group.forEach((series, index) => {
        console.log(`\n[${index + 1}] Series: "${series.title}"`);
        console.log(`    Contains ${series.animes.length} anime:`);
        series.animes.forEach(anime => {
          console.log(`    - ${anime.title} (${anime.year || 'Unknown'}) - ${anime.episodes || '?'} episodes - ${anime.type}`);
        });
      });
      
      // Ask user which should be the main series
      const options = group.map(series => `"${series.title}" (${series.animes.length} anime)`);
      
      const choice = await askUser(
        `\nWhich should be the main series name for this group?`,
        options
      );
      
      if (choice) {
        const chosenIndex = options.findIndex(opt => opt === choice);
        const mainSeries = group[chosenIndex];
        const otherSeries = group.filter((_, idx) => idx !== chosenIndex);
        
        console.log(`\n✅ You chose: "${mainSeries.title}" as the main series`);
        
        if (otherSeries.length > 0) {
          console.log(`🔄 Will merge these series into "${mainSeries.title}":`);
          otherSeries.forEach(series => console.log(`   - "${series.title}"`));
          
          // Perform the merge
          for (const series of otherSeries) {
            console.log(`\n📝 Moving ${series.animes.length} anime from "${series.title}" to "${mainSeries.title}"`);
            
            for (const anime of series.animes) {
              await prisma.anime.update({
                where: { id: anime.id },
                data: { seriesId: mainSeries.id }
              });
            }
            
            // Delete the empty series
            await prisma.animeSeries.delete({
              where: { id: series.id }
            });
            
            console.log(`   ✅ Deleted empty series "${series.title}"`);
          }
          
          // Update episode count and other stats for main series
          const allAnime = await prisma.anime.findMany({
            where: { seriesId: mainSeries.id }
          });
          
          const totalEpisodes = allAnime.reduce((sum, anime) => sum + (anime.episodes || 0), 0);
          const years = allAnime.map(a => a.year).filter(Boolean);
          const startYear = years.length > 0 ? Math.min(...years) : null;
          const endYear = years.length > 0 ? Math.max(...years) : null;
          
          await prisma.animeSeries.update({
            where: { id: mainSeries.id },
            data: {
              totalEpisodes,
              startYear,
              endYear
            }
          });
          
          console.log(`   ✅ Updated "${mainSeries.title}" with ${totalEpisodes} total episodes`);
        }
      } else {
        console.log(`⏭️  Skipped group - keeping series separate`);
      }
    }
    
    console.log(`\n🎉 Series analysis complete!`);
    
    // Show final summary
    const finalSeries = await prisma.animeSeries.findMany({
      include: {
        animes: true
      }
    });
    
    console.log(`\n📊 Final summary: ${finalSeries.length} series total`);
    console.log(`Total anime: ${finalSeries.reduce((sum, s) => sum + s.animes.length, 0)}`);
    
  } catch (error) {
    console.error('❌ Error analyzing series:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

analyzeSeries();
