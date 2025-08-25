const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import the series detection functions
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[:\-\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBaseTitle(title) {
  let baseTitle = normalizeTitle(title);
  
  // Remove season indicators
  baseTitle = baseTitle.replace(/(?:season|series|cour)\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*(?:season|series)/gi, '');
  baseTitle = baseTitle.replace(/(?:part|chapter|arc)\s*(\d+)/gi, '');
  baseTitle = baseTitle.replace(/\s+(\d+)$/, '');
  baseTitle = baseTitle.replace(/\s+(II|III|IV|V|VI|VII|VIII|IX|X)$/gi, '');
  
  // Remove special type indicators
  baseTitle = baseTitle.replace(/\b(ova|movie|film|special)\b/gi, '');
  
  // Clean up extra spaces
  baseTitle = baseTitle.replace(/\s+/g, ' ').trim();
  
  return baseTitle;
}

function determineSeriesType(anime) {
  const title = normalizeTitle(anime.title);
  const type = anime.type?.toLowerCase();
  
  // Check for special types first
  if (type === 'movie') return 'movie';
  if (type === 'ova') return 'ova';
  if (type === 'special') return 'special';
  
  // Check title patterns
  if (title.includes('movie') || title.includes('film')) return 'movie';
  if (title.includes('ova')) return 'ova';
  if (title.includes('special')) return 'special';
  
  // Check for sequel indicators
  if (title.includes('season') || title.includes('sequel')) {
    return 'sequel';
  }
  
  // Check for side story indicators
  if (title.includes('side') || title.includes('spin') || title.includes('gaiden')) {
    return 'side_story';
  }
  
  // Default to main series
  return 'main';
}

async function testSeriesFix() {
  console.log('🧪 Testing series fix logic...\n');
  
  // Simulate the One Piece main anime data
  const onePieceMainData = {
    title: 'One Piece',
    title_english: 'One Piece',
    title_japanese: 'ワンピース',
    type: 'TV',
    synopsis: 'The main One Piece series...',
    images: {
      jpg: {
        large_image_url: 'https://example.com/onepiece.jpg'
      }
    }
  };
  
  const baseTitle = extractBaseTitle(onePieceMainData.title);
  console.log(`Base title for "${onePieceMainData.title}": "${baseTitle}"`);
  
  // Look for existing series with similar title
  const existingSeries = await prisma.animeSeries.findMany({
    where: {
      OR: [
        { title: { contains: baseTitle, mode: 'insensitive' } },
        { titleEnglish: { contains: baseTitle, mode: 'insensitive' } }
      ]
    }
  });
  
  console.log(`Found ${existingSeries.length} existing series:`);
  
  const currentSeriesType = determineSeriesType(onePieceMainData);
  console.log(`Current anime type: ${currentSeriesType}`);
  
  for (const series of existingSeries) {
    const seriesBaseTitle = extractBaseTitle(series.title);
    console.log(`\nChecking series: "${series.title}"`);
    console.log(`Series base title: "${seriesBaseTitle}"`);
    console.log(`Match: ${seriesBaseTitle === baseTitle}`);
    console.log(`Is main entry: ${series.isMainEntry}`);
    
    if (seriesBaseTitle === baseTitle) {
      if (currentSeriesType === 'main' && !series.isMainEntry) {
        console.log(`🔄 Should rename series from "${series.title}" to "${onePieceMainData.title}"`);
        
        // Actually perform the update
        try {
          await prisma.animeSeries.update({
            where: { id: series.id },
            data: {
              title: onePieceMainData.title,
              titleEnglish: onePieceMainData.title_english,
              titleJapanese: onePieceMainData.title_japanese,
              isMainEntry: true,
              description: onePieceMainData.synopsis || series.description,
              imageUrl: onePieceMainData.images.jpg.large_image_url || series.imageUrl
            }
          });
          
          console.log(`✅ Successfully renamed series to: ${onePieceMainData.title}`);
        } catch (error) {
          console.error(`❌ Error updating series:`, error);
        }
      } else {
        console.log(`ℹ️  No rename needed`);
      }
    }
  }
  
  await prisma.$disconnect();
}

testSeriesFix().catch(console.error);
