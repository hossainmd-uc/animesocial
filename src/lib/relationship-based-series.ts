import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Relationship types that indicate series connection (ordered by strength)
const SERIES_RELATIONSHIPS = {
  // Strong relationships - definitely same series
  DIRECT: ['Sequel', 'Prequel'],
  
  // Medium relationships - probably same series  
  STORY: ['Side story', 'Parent story', 'Full story'],
  
  // Weak relationships - might be same series
  ALTERNATIVE: ['Alternative version', 'Summary', 'Alternative setting']
};

export interface SeriesDetectionResult {
  existingSeriesId: string | null;
  shouldCreateSeries: boolean;
  relatedAnimeIds: number[];
  seriesType: string;
  seriesOrder: number;
}

/**
 * Enhanced series detection using API relationship data
 */
export async function detectSeriesForAnime(animeData: any): Promise<SeriesDetectionResult> {
  console.log(`🔍 Detecting series for: ${animeData.title}`);
  
  // Step 1: Check if any related anime already exist in our database
  const relatedMalIds = extractRelatedAnimeIds(animeData.relations || []);
  
  if (relatedMalIds.length > 0) {
    console.log(`  Found ${relatedMalIds.length} related anime in API data`);
    
    // Look for existing anime with these MAL IDs
    const existingRelatedAnime = await prisma.anime.findMany({
      where: {
        malId: { in: relatedMalIds }
      },
      include: {
        series: true
      }
    });
    
    // If any related anime already have a series, use that series
    const animeWithSeries = existingRelatedAnime.filter(a => a.seriesId);
    if (animeWithSeries.length > 0) {
      const existingSeries = animeWithSeries[0];
      console.log(`  ✅ Found existing series: ${existingSeries.series?.title}`);
      
      return {
        existingSeriesId: existingSeries.seriesId!,
        shouldCreateSeries: false,
        relatedAnimeIds: relatedMalIds,
        seriesType: determineSeriesTypeFromRelations(animeData),
        seriesOrder: determineSeriesOrderFromRelations(animeData, existingRelatedAnime)
      };
    }
    
    // If related anime exist but no series yet, we should create a series
    if (existingRelatedAnime.length > 0) {
      console.log(`  📺 Related anime exist but no series - will create series`);
      return {
        existingSeriesId: null,
        shouldCreateSeries: true,
        relatedAnimeIds: relatedMalIds,
        seriesType: determineSeriesTypeFromRelations(animeData),
        seriesOrder: 1 // Will be recalculated when creating series
      };
    }
  }
  
  // Step 2: Fallback to title-based detection only if no relationships found
  console.log(`  No API relationships found, checking title similarity...`);
  const titleBasedSeries = await findSeriesByTitleSimilarity(animeData);
  
  if (titleBasedSeries) {
    console.log(`  ⚠️ Found potential series via title matching: ${titleBasedSeries.title}`);
    return {
      existingSeriesId: titleBasedSeries.id,
      shouldCreateSeries: false,
      relatedAnimeIds: [],
      seriesType: determineSeriesTypeFromTitle(animeData.title),
      seriesOrder: determineOrderFromYear(animeData.year)
    };
  }
  
  // Step 3: Create standalone series
  console.log(`  📱 Will create standalone series`);
  return {
    existingSeriesId: null,
    shouldCreateSeries: true,
    relatedAnimeIds: [],
    seriesType: 'main',
    seriesOrder: 1
  };
}

/**
 * Extract MAL IDs of related anime from API relations
 */
function extractRelatedAnimeIds(relations: any[]): number[] {
  const malIds: number[] = [];
  
  for (const relationGroup of relations) {
    const relationType = relationGroup.relation;
    
    // Only include relationships that indicate series connection
    if (isSeriesRelationship(relationType)) {
      for (const entry of relationGroup.entry) {
        if (entry.type === 'anime' && entry.mal_id) {
          malIds.push(entry.mal_id);
        }
      }
    }
  }
  
  return Array.from(new Set(malIds)); // Remove duplicates
}

/**
 * Check if a relationship type indicates series connection
 */
function isSeriesRelationship(relationType: string): boolean {
  const allRelationships = [
    ...SERIES_RELATIONSHIPS.DIRECT,
    ...SERIES_RELATIONSHIPS.STORY,
    ...SERIES_RELATIONSHIPS.ALTERNATIVE
  ];
  
  return allRelationships.includes(relationType);
}

/**
 * Determine series type based on API relationships
 */
function determineSeriesTypeFromRelations(animeData: any): string {
  const relations = animeData.relations || [];
  const type = animeData.type?.toLowerCase();
  
  // Check type first
  if (type === 'movie') return 'movie';
  if (type === 'ova') return 'ova';  
  if (type === 'special') return 'special';
  
  // Check relationships
  const hasPrequel = relations.some((r: any) => r.relation === 'Prequel');
  const hasSequel = relations.some((r: any) => r.relation === 'Sequel');
  
  if (hasPrequel && hasSequel) return 'sequel'; // Middle of series
  if (hasPrequel && !hasSequel) return 'sequel'; // End of series
  if (!hasPrequel && hasSequel) return 'main'; // Start of series
  
  // Check for side story indicators
  const isSideStory = relations.some((r: any) => 
    r.relation === 'Side story' || r.relation === 'Spin-off'
  );
  if (isSideStory) return 'side_story';
  
  return 'main';
}

/**
 * Determine series order based on relationships and existing anime
 */
function determineSeriesOrderFromRelations(animeData: any, existingAnime: any[]): number {
  const relations = animeData.relations || [];
  
  // Look for prequel relationships to determine order
  const prequelRelations = relations.filter((r: any) => r.relation === 'Prequel');
  
  if (prequelRelations.length > 0) {
    // Find the highest order among prequels and add 1
    const prequelMalIds = prequelRelations.flatMap((r: any) => 
      r.entry.filter((e: any) => e.type === 'anime').map((e: any) => e.mal_id)
    );
    
    const prequelAnime = existingAnime.filter(a => prequelMalIds.includes(a.malId));
    if (prequelAnime.length > 0) {
      const maxOrder = Math.max(...prequelAnime.map(a => a.seriesOrder || 1));
      return maxOrder + 1;
    }
  }
  
  // Fallback to year-based ordering
  return determineOrderFromYear(animeData.year);
}

/**
 * Fallback: Find series by title similarity (only when no relationships exist)
 */
async function findSeriesByTitleSimilarity(animeData: any): Promise<any | null> {
  // Simple base title extraction for fallback
  const baseTitle = animeData.title
    .toLowerCase()
    .replace(/season\s*\d+/i, '')
    .replace(/\s*\d+(?:st|nd|rd|th)?\s*season/i, '')
    .replace(/:\s*/, ' ')
    .trim();
  
  const existingSeries = await prisma.animeSeries.findMany({
    where: {
      OR: [
        { title: { contains: baseTitle, mode: 'insensitive' } },
        { titleEnglish: { contains: baseTitle, mode: 'insensitive' } }
      ]
    }
  });
  
  // Only return if very high confidence match
  for (const series of existingSeries) {
    const seriesBase = series.title.toLowerCase().replace(/:\s*/, ' ').trim();
    if (seriesBase === baseTitle) {
      return series;
    }
  }
  
  return null;
}

/**
 * Determine series type from title (fallback method)
 */
function determineSeriesTypeFromTitle(title: string): string {
  const normalizedTitle = title.toLowerCase();
  
  if (normalizedTitle.includes('movie')) return 'movie';
  if (normalizedTitle.includes('ova')) return 'ova';
  if (normalizedTitle.includes('special')) return 'special';
  if (normalizedTitle.includes('season') || normalizedTitle.match(/\s+\d+$/)) return 'sequel';
  
  return 'main';
}

/**
 * Determine order from year (fallback method)
 */
function determineOrderFromYear(year: number | null): number {
  if (!year) return 1;
  
  // Use year as a rough ordering mechanism
  // This is a fallback and will be refined when we have full relationship data
  return year - 1960; // Arbitrary base year to get reasonable numbers
}

const RelationshipBasedSeries = {
  detectSeriesForAnime,
  extractRelatedAnimeIds,
  isSeriesRelationship
};

export default RelationshipBasedSeries; 