import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SeriesCandidate {
  mainTitle: string;
  animeIds: string[];
  malIds: number[];
  averageScore?: number;
  totalEpisodes?: number;
  startYear?: number;
  endYear?: number;
  imageUrl?: string;
}

// Common patterns for series detection
const SERIES_PATTERNS = {
  // Season patterns
  SEASON_NUMBERS: /(?:season|series|cour)\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*(?:season|series)/i,
  NUMERIC_SUFFIXES: /\s+(\d+)$/,
  ROMAN_NUMERALS: /\s+(II|III|IV|V|VI|VII|VIII|IX|X)$/i,
  
  // Part patterns
  PART_PATTERNS: /(?:part|chapter|arc)\s*(\d+)/i,
  
  // Special patterns
  OVA_MOVIE: /\b(ova|movie|film|special)\b/i,
  SEQUEL_PREQUEL: /\b(sequel|prequel|continuation|final|movie|ova|special)\b/i,
  
  // Common series indicators
  SERIES_INDICATORS: [
    'season', 'series', 'part', 'chapter', 'arc', 'sequel', 'prequel', 
    'final', 'movie', 'ova', 'special', 'continuation', 'cour'
  ]
};

// Relationship types that indicate series connection
const SERIES_RELATION_TYPES = [
  'Sequel', 'Prequel', 'Alternative version', 'Side story', 
  'Parent story', 'Full story', 'Summary'
];

/**
 * Normalize anime title for comparison
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:\-\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract base title by removing season/part indicators
 */
export function extractBaseTitle(title: string): string {
  let baseTitle = normalizeTitle(title);
  
  // Remove season indicators
  baseTitle = baseTitle.replace(SERIES_PATTERNS.SEASON_NUMBERS, '');
  baseTitle = baseTitle.replace(SERIES_PATTERNS.PART_PATTERNS, '');
  baseTitle = baseTitle.replace(SERIES_PATTERNS.NUMERIC_SUFFIXES, '');
  baseTitle = baseTitle.replace(SERIES_PATTERNS.ROMAN_NUMERALS, '');
  
  // Remove special type indicators
  baseTitle = baseTitle.replace(SERIES_PATTERNS.OVA_MOVIE, '');
  
  // Clean up extra spaces
  baseTitle = baseTitle.replace(/\s+/g, ' ').trim();
  
  return baseTitle;
}

/**
 * Determine series type based on anime properties
 */
export function determineSeriesType(anime: any): string {
  const title = normalizeTitle(anime.title);
  const type = anime.type?.toLowerCase();
  
  // Check for special types first
  if (type === 'movie') return 'movie';
  if (type === 'ova') return 'ova';
  if (type === 'special') return 'special';
  
  // Check title patterns
  if (SERIES_PATTERNS.OVA_MOVIE.test(title)) {
    if (title.includes('movie') || title.includes('film')) return 'movie';
    if (title.includes('ova')) return 'ova';
    if (title.includes('special')) return 'special';
  }
  
  // Check for sequel indicators
  if (SERIES_PATTERNS.SEASON_NUMBERS.test(title) || 
      SERIES_PATTERNS.ROMAN_NUMERALS.test(title) ||
      title.includes('sequel') || 
      title.includes('season')) {
    return 'sequel';
  }
  
  // Check for side story indicators
  if (title.includes('side') || title.includes('spin') || title.includes('gaiden')) {
    return 'side_story';
  }
  
  // Default to main series
  return 'main';
}

/**
 * Determine series order based on title and relations
 */
export function determineSeriesOrder(anime: any, relations: any[]): number {
  const title = normalizeTitle(anime.title);
  
  // Extract number from season patterns
  const seasonMatch = title.match(SERIES_PATTERNS.SEASON_NUMBERS);
  if (seasonMatch) {
    return parseInt(seasonMatch[1] || seasonMatch[2]) || 1;
  }
  
  // Extract from numeric suffixes
  const numMatch = title.match(SERIES_PATTERNS.NUMERIC_SUFFIXES);
  if (numMatch) {
    return parseInt(numMatch[1]) || 1;
  }
  
  // Roman numerals
  const romanMatch = title.match(SERIES_PATTERNS.ROMAN_NUMERALS);
  if (romanMatch) {
    const romanMap: { [key: string]: number } = {
      'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
      'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
    };
    return romanMap[romanMatch[1].toUpperCase()] || 1;
  }
  
  // Use air date as fallback
  if (anime.airedFrom) {
    return new Date(anime.airedFrom).getFullYear();
  }
  
  return 1;
}

/**
 * Group anime by series using title similarity and relations
 */
export async function detectSeries(): Promise<SeriesCandidate[]> {
  console.log('🔍 Starting series detection...');
  
  // Fetch all anime with relations
  const allAnime = await prisma.anime.findMany({
    include: {
      relations: true
    },
    orderBy: {
      year: 'asc'
    }
  });
  
  console.log(`📊 Found ${allAnime.length} anime to process`);
  
  const seriesMap = new Map<string, SeriesCandidate>();
  const processedAnime = new Set<string>();
  
  for (const anime of allAnime) {
    if (processedAnime.has(anime.id)) continue;
    
    const baseTitle = extractBaseTitle(anime.title);
    
    // Find related anime through direct relations
    const relatedAnime = new Set([anime]);
    const relatedMalIds = new Set([anime.malId]);
    
    // Add anime with matching relations
    for (const relation of anime.relations) {
      if (SERIES_RELATION_TYPES.includes(relation.relationType)) {
        const relatedEntry = allAnime.find(a => a.malId === relation.relatedMalId);
        if (relatedEntry && !processedAnime.has(relatedEntry.id)) {
          relatedAnime.add(relatedEntry);
          relatedMalIds.add(relatedEntry.malId);
        }
      }
    }
    
    // Add anime with similar base titles
    for (const otherAnime of allAnime) {
      if (processedAnime.has(otherAnime.id) || relatedAnime.has(otherAnime)) continue;
      
      const otherBaseTitle = extractBaseTitle(otherAnime.title);
      
      // Calculate title similarity
      const similarity = calculateTitleSimilarity(baseTitle, otherBaseTitle);
      if (similarity > 0.8) { // 80% similarity threshold
        relatedAnime.add(otherAnime);
        relatedMalIds.add(otherAnime.malId);
      }
    }
    
    // Only create series if we have multiple related entries
    if (relatedAnime.size > 1) {
      const animeArray = Array.from(relatedAnime);
      
      // Find the best representative title (usually the first/main entry)
      const mainAnime = animeArray.reduce((prev, current) => {
        const prevType = determineSeriesType(prev);
        const currentType = determineSeriesType(current);
        
        // Prefer main series over specials/movies
        if (prevType === 'main' && currentType !== 'main') return prev;
        if (currentType === 'main' && prevType !== 'main') return current;
        
        // Prefer earlier aired date
        if (prev.airedFrom && current.airedFrom) {
          return new Date(prev.airedFrom) < new Date(current.airedFrom) ? prev : current;
        }
        
        return prev;
      });
      
      const validYears = animeArray.map(a => a.year).filter((year): year is number => year !== null);
      
      const seriesCandidate: SeriesCandidate = {
        mainTitle: cleanSeriesTitle(mainAnime.title),
        animeIds: animeArray.map(a => a.id),
        malIds: Array.from(relatedMalIds),
        averageScore: animeArray.reduce((sum, a) => sum + (a.score || 0), 0) / animeArray.length,
        totalEpisodes: animeArray.reduce((sum, a) => sum + (a.episodes || 0), 0),
        startYear: validYears.length > 0 ? Math.min(...validYears) : undefined,
        endYear: validYears.length > 0 ? Math.max(...validYears) : undefined,
        imageUrl: mainAnime.imageUrl
      };
      
      seriesMap.set(baseTitle, seriesCandidate);
      
      // Mark all related anime as processed
      animeArray.forEach(a => processedAnime.add(a.id));
      
      console.log(`📺 Created series: "${seriesCandidate.mainTitle}" with ${animeArray.length} entries`);
    } else {
      // Single anime - create individual series
      processedAnime.add(anime.id);
    }
  }
  
  console.log(`✅ Series detection complete. Found ${seriesMap.size} series candidates`);
  return Array.from(seriesMap.values());
}

/**
 * Calculate similarity between two titles
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = title1.split(' ').filter(w => w.length > 2);
  const words2 = title2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords.length / totalWords;
}

/**
 * Clean series title for display
 */
function cleanSeriesTitle(title: string): string {
  // Remove season indicators for series title
  let cleaned = title.replace(/:\s*season\s*\d+/i, '');
  cleaned = cleaned.replace(/\s*season\s*\d+/i, '');
  cleaned = cleaned.replace(/\s*\d+(?:st|nd|rd|th)\s*season/i, '');
  cleaned = cleaned.replace(/\s+(II|III|IV|V|VI|VII|VIII|IX|X)$/i, '');
  cleaned = cleaned.replace(/\s*:\s*/, ': ');
  
  return cleaned.trim();
}

export default {
  detectSeries,
  normalizeTitle,
  extractBaseTitle,
  determineSeriesType,
  determineSeriesOrder
}; 