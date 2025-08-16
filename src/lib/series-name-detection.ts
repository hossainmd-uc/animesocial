import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Strategy for determining series name from multiple related anime
 */
export async function determineSeriesName(relatedAnime: any[]): Promise<{
  seriesTitle: string;
  seriesTitleEnglish?: string;
  seriesTitleJapanese?: string;
}> {
  console.log(`🎯 Determining series name from ${relatedAnime.length} related anime`);
  
  // Strategy 1: Find the "main" anime (no prequel relationships)
  const mainAnime = findMainAnime(relatedAnime);
  if (mainAnime) {
    console.log(`  📺 Found main anime: ${mainAnime.title}`);
    return extractSeriesNameFromMainAnime(mainAnime);
  }
  
  // Strategy 2: Use the earliest anime chronologically
  const earliestAnime = findEarliestAnime(relatedAnime);
  if (earliestAnime) {
    console.log(`  📅 Using earliest anime: ${earliestAnime.title} (${earliestAnime.year})`);
    return extractSeriesNameFromAnime(earliestAnime);
  }
  
  // Strategy 3: Find the cleanest title (least season indicators)
  const cleanestAnime = findCleanestTitle(relatedAnime);
  console.log(`  🧹 Using cleanest title: ${cleanestAnime.title}`);
  return extractSeriesNameFromAnime(cleanestAnime);
}

/**
 * Find the "main" anime by relationship analysis
 */
function findMainAnime(animeList: any[]): any | null {
  // Main anime characteristics:
  // 1. Has no prequel relationships
  // 2. Has sequel relationships
  // 3. Is TV type (not movie/OVA)
  
  for (const anime of animeList) {
    const relations = anime.relations || [];
    const hasPrequel = relations.some((r: any) => r.relation === 'Prequel');
    const hasSequel = relations.some((r: any) => r.relation === 'Sequel');
    const isTVSeries = anime.type === 'TV';
    
    // Perfect main anime: TV series with sequel but no prequel
    if (!hasPrequel && hasSequel && isTVSeries) {
      return anime;
    }
  }
  
  // Fallback: TV series with no prequel (even if no sequel)
  for (const anime of animeList) {
    const relations = anime.relations || [];
    const hasPrequel = relations.some((r: any) => r.relation === 'Prequel');
    const isTVSeries = anime.type === 'TV';
    
    if (!hasPrequel && isTVSeries) {
      return anime;
    }
  }
  
  return null;
}

/**
 * Find the earliest anime by air date
 */
function findEarliestAnime(animeList: any[]): any | null {
  const tvSeries = animeList.filter(anime => anime.type === 'TV');
  if (tvSeries.length === 0) return animeList[0];
  
  return tvSeries.reduce((earliest, current) => {
    const earliestYear = earliest.year || 9999;
    const currentYear = current.year || 9999;
    
    return currentYear < earliestYear ? current : earliest;
  });
}

/**
 * Find the anime with the cleanest title (fewest season indicators)
 */
function findCleanestTitle(animeList: any[]): any {
  return animeList.reduce((cleanest, current) => {
    const cleanestScore = getTitleCleanlinessScore(cleanest.title);
    const currentScore = getTitleCleanlinessScore(current.title);
    
    return currentScore > cleanestScore ? current : cleanest;
  });
}

/**
 * Score title cleanliness (higher = cleaner)
 */
function getTitleCleanlinessScore(title: string): number {
  const lowerTitle = title.toLowerCase();
  let score = 100;
  
  // Deduct points for season indicators
  if (lowerTitle.includes('season')) score -= 30;
  if (lowerTitle.includes('part')) score -= 25;
  if (lowerTitle.match(/\b\d+(?:st|nd|rd|th)?\s*season/)) score -= 35;
  if (lowerTitle.match(/\s+\d+$/)) score -= 20;
  if (lowerTitle.match(/\s+(ii|iii|iv|v|vi|vii|viii|ix|x)$/)) score -= 20;
  if (lowerTitle.includes('final')) score -= 15;
  if (lowerTitle.includes('movie')) score -= 40;
  if (lowerTitle.includes('ova')) score -= 50;
  if (lowerTitle.includes('special')) score -= 45;
  
  return score;
}

/**
 * Extract series name from the main anime (already clean)
 */
function extractSeriesNameFromMainAnime(anime: any): {
  seriesTitle: string;
  seriesTitleEnglish?: string;
  seriesTitleJapanese?: string;
} {
  return {
    seriesTitle: anime.title_english || anime.title,
    seriesTitleEnglish: anime.title_english,
    seriesTitleJapanese: anime.title_japanese
  };
}

/**
 * Extract series name from any anime by cleaning the title
 */
function extractSeriesNameFromAnime(anime: any): {
  seriesTitle: string;
  seriesTitleEnglish?: string;
  seriesTitleJapanese?: string;
} {
  const englishTitle = anime.title_english ? cleanTitleForSeries(anime.title_english) : undefined;
  const mainTitle = cleanTitleForSeries(anime.title);
  
  return {
    seriesTitle: englishTitle || mainTitle,
    seriesTitleEnglish: englishTitle,
    seriesTitleJapanese: anime.title_japanese
  };
}

/**
 * Clean a title to make it suitable for series name
 */
function cleanTitleForSeries(title: string): string {
  let cleaned = title;
  
  // Remove season indicators
  cleaned = cleaned.replace(/:\s*Season\s*\d+/gi, '');
  cleaned = cleaned.replace(/\s*Season\s*\d+/gi, '');
  cleaned = cleaned.replace(/\s*\d+(?:st|nd|rd|th)?\s*Season/gi, '');
  
  // Remove part indicators
  cleaned = cleaned.replace(/:\s*Part\s*\d+/gi, '');
  cleaned = cleaned.replace(/\s*Part\s*\d+/gi, '');
  
  // Remove roman numerals at the end
  cleaned = cleaned.replace(/\s+(II|III|IV|V|VI|VII|VIII|IX|X)$/gi, '');
  
  // Remove numeric suffixes
  cleaned = cleaned.replace(/\s+\d+$/, '');
  
  // Remove specific patterns
  cleaned = cleaned.replace(/:\s*Final\s*Season?/gi, '');
  cleaned = cleaned.replace(/:\s*The\s*Final\s*Season?/gi, '');
  cleaned = cleaned.replace(/:\s*Kanketsu-hen/gi, ''); // Japanese "final chapter"
  
  // Clean up spacing and colons
  cleaned = cleaned.replace(/\s*:\s*$/, ''); // Remove trailing colons
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Real-world examples for testing
 */
export const EXAMPLE_SERIES_NAMES = {
  attackOnTitan: [
    { title: "Shingeki no Kyojin", title_english: "Attack on Titan", year: 2013, type: "TV" },
    { title: "Shingeki no Kyojin Season 2", title_english: "Attack on Titan Season 2", year: 2017, type: "TV" },
    { title: "Shingeki no Kyojin Season 3", title_english: "Attack on Titan Season 3", year: 2018, type: "TV" },
    { title: "Shingeki no Kyojin: The Final Season", title_english: "Attack on Titan: The Final Season", year: 2020, type: "TV" }
  ],
  jojosBizarreAdventure: [
    { title: "JoJo no Kimyou na Bouken", title_english: "JoJo's Bizarre Adventure", year: 2012, type: "TV" },
    { title: "JoJo no Kimyou na Bouken: Stardust Crusaders", title_english: "JoJo's Bizarre Adventure: Stardust Crusaders", year: 2014, type: "TV" },
    { title: "JoJo no Kimyou na Bouken: Diamond wa Kudakenai", title_english: "JoJo's Bizarre Adventure: Diamond is Unbreakable", year: 2016, type: "TV" }
  ],
  fate: [
    { title: "Fate/Zero", title_english: "Fate/Zero", year: 2011, type: "TV" },
    { title: "Fate/Zero 2nd Season", title_english: "Fate/Zero 2nd Season", year: 2012, type: "TV" }
  ]
};

// Test function to validate our logic
export async function testSeriesNameDetection() {
  console.log('🧪 Testing Series Name Detection\n');
  
  for (const [seriesName, animeList] of Object.entries(EXAMPLE_SERIES_NAMES)) {
    console.log(`Testing ${seriesName}:`);
    const result = await determineSeriesName(animeList);
    console.log(`  Result: "${result.seriesTitle}"`);
    console.log(`  English: "${result.seriesTitleEnglish}"`);
    console.log('');
  }
}

const SeriesNameDetection = {
  determineSeriesName,
  cleanTitleForSeries,
  findMainAnime,
  findEarliestAnime,
  findCleanestTitle
};

export default SeriesNameDetection; 