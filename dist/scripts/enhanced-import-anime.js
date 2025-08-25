"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importAllAnimeWithSeries = importAllAnimeWithSeries;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline = __importStar(require("readline"));
const series_detection_1 = require("../src/lib/series-detection");
const prisma = new client_1.PrismaClient();
// Setup readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// Helper function to ask user questions
function askUser(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}
const PROGRESS_FILE = path_1.default.join(__dirname, 'enhanced-import-progress.json');
const DELAY_BETWEEN_REQUESTS = 400; // 400ms delay to respect rate limit
// Removed TARGET_ANIME_COUNT - will run continuously until manually stopped
// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Load or initialize progress
function loadProgress() {
    if (fs_1.default.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs_1.default.readFileSync(PROGRESS_FILE, 'utf8'));
    }
    return { currentPage: 1, processedIds: [], failedIds: [], createdSeries: [] };
}
// Save progress
function saveProgress(progress) {
    fs_1.default.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}
// Find or create series for an anime
async function findOrCreateSeries(animeData) {
    var _a;
    try {
        const baseTitle = (0, series_detection_1.extractBaseTitle)(animeData.title);
        const normalizedTitle = (0, series_detection_1.normalizeTitle)(animeData.title);
        // First, check relationships and use MAL relationship data to make smart decisions
        if (animeData.relations && animeData.relations.length > 0) {
            for (const relationGroup of animeData.relations) {
                const relationType = relationGroup.relation;
                const relatedAnimeIds = ((_a = relationGroup.entry) === null || _a === void 0 ? void 0 : _a.filter((e) => e.type === 'anime').map((e) => e.mal_id)) || [];
                if (relatedAnimeIds.length > 0) {
                    // Check if any related anime are already in our database
                    const existingRelatedAnime = await prisma.anime.findMany({
                        where: { malId: { in: relatedAnimeIds } },
                        include: { series: true }
                    });
                    const relatedWithSeries = existingRelatedAnime.filter(a => a.series);
                    if (relatedWithSeries.length > 0) {
                        const existingSeries = relatedWithSeries[0].series;
                        const currentTitle = animeData.title;
                        const currentYear = animeData.year;
                        console.log(`  🔗 Found related anime through "${relationType}" relationship`);
                        console.log(`  📺 Related: "${relatedWithSeries[0].title}" in series "${existingSeries.title}"`);
                        console.log(`  📅 Current: "${currentTitle}" (${currentYear || 'Unknown'})`);
                        // Use relationship type to determine if we should rename the series
                        let shouldRename = false;
                        let reason = '';
                        if (relationType === 'Sequel') {
                            // Check if current anime is older than the earliest in the existing series
                            const seriesAnime = await prisma.anime.findMany({
                                where: { seriesId: existingSeries.id },
                                select: { year: true }
                            });
                            const seriesYears = seriesAnime.map(a => a.year).filter(Boolean);
                            const earliestSeriesYear = seriesYears.length > 0 ? Math.min(...seriesYears) : null;
                            if (currentYear && earliestSeriesYear && currentYear < earliestSeriesYear) {
                                shouldRename = true;
                                reason = 'current anime is older (original in sequel relationship)';
                            }
                            else {
                                shouldRename = false;
                                reason = 'existing series has older anime (keeping original series name)';
                            }
                        }
                        else if (relationType === 'Prequel') {
                            // Current anime is a prequel → add to existing series without rename
                            shouldRename = false;
                            reason = 'current anime is a prequel';
                        }
                        else if (relationType === 'Alternative Version' || relationType === 'Side Story') {
                            // Check year as tiebreaker for alternative versions
                            const seriesAnime = await prisma.anime.findMany({
                                where: { seriesId: existingSeries.id },
                                select: { year: true }
                            });
                            const seriesYears = seriesAnime.map(a => a.year).filter(Boolean);
                            const earliestSeriesYear = seriesYears.length > 0 ? Math.min(...seriesYears) : null;
                            if (currentYear && earliestSeriesYear && currentYear < earliestSeriesYear) {
                                shouldRename = true;
                                reason = 'current anime is older alternative version';
                            }
                            else if (currentYear && !earliestSeriesYear) {
                                // If existing series has no year data but current anime does, assume current is likely original
                                shouldRename = true;
                                reason = 'current anime has year data, existing series does not (likely original)';
                            }
                            else {
                                shouldRename = false;
                                reason = 'current anime is newer alternative/side story';
                            }
                        }
                        else {
                            // For other relationships (Parent Story, Full Story, etc.), use year comparison
                            const seriesAnime = await prisma.anime.findMany({
                                where: { seriesId: existingSeries.id },
                                select: { year: true }
                            });
                            const seriesYears = seriesAnime.map(a => a.year).filter(Boolean);
                            const earliestSeriesYear = seriesYears.length > 0 ? Math.min(...seriesYears) : null;
                            if (currentYear && earliestSeriesYear && currentYear < earliestSeriesYear) {
                                shouldRename = true;
                                reason = 'current anime is older';
                            }
                            else if (currentYear && !earliestSeriesYear) {
                                // If existing series has no year data but current anime does, assume current is likely original
                                shouldRename = true;
                                reason = 'current anime has year data, existing series does not (likely original)';
                            }
                            else {
                                shouldRename = false;
                                reason = 'current anime is newer or same age';
                            }
                        }
                        if (shouldRename) {
                            console.log(`  🔄 Renaming series to "${currentTitle}" (${reason})`);
                            await prisma.animeSeries.update({
                                where: { id: existingSeries.id },
                                data: {
                                    title: animeData.title,
                                    titleEnglish: animeData.title_english,
                                    titleJapanese: animeData.title_japanese,
                                    isMainEntry: true,
                                    description: animeData.synopsis || existingSeries.description,
                                    imageUrl: animeData.images.jpg.large_image_url || existingSeries.imageUrl
                                }
                            });
                            console.log(`  ✅ Renamed series from "${existingSeries.title}" to "${currentTitle}"`);
                        }
                        else {
                            console.log(`  ✅ Adding to existing series "${existingSeries.title}" (${reason})`);
                        }
                        return existingSeries.id;
                    }
                }
            }
        }
        // Fallback: Use similarity detection when no direct relationships found
        console.log(`  🔍 No direct relationships found, checking title similarity...`);
        // Extract core words from title for similarity detection
        function extractCoreWords(title) {
            return title
                .toLowerCase()
                .replace(/[°':!?.,()-]/g, ' ') // Remove special characters
                .replace(/\b(the|and|or|of|in|on|at|to|for|with|by|no|hen|wa)\b/g, ' ') // Remove common words including Japanese
                .split(/\s+/)
                .filter(word => word.length > 2) // Keep words longer than 2 characters
                .filter(word => !['season', 'part', 'final', 'new', 'movie', 'ova', 'special', 'episode'].includes(word)); // Remove anime-specific words
        }
        // Calculate similarity between two titles based on shared core words
        function calculateSimilarity(title1, title2) {
            const words1 = extractCoreWords(title1);
            const words2 = extractCoreWords(title2);
            if (words1.length === 0 || words2.length === 0)
                return 0;
            const sharedWords = words1.filter(word => words2.includes(word));
            const maxWords = Math.max(words1.length, words2.length);
            return sharedWords.length / maxWords;
        }
        // Get all existing series to check for similarities
        const allSeries = await prisma.animeSeries.findMany({
            include: {
                animes: {
                    select: {
                        title: true,
                        year: true,
                        episodes: true
                    },
                    orderBy: { year: 'asc' }
                }
            }
        });
        const currentTitle = animeData.title.trim();
        const currentYear = animeData.year;
        const currentSeriesType = (0, series_detection_1.determineSeriesType)(animeData);
        // Find similar series based on core words
        const similarSeries = [];
        for (const series of allSeries) {
            const similarity = calculateSimilarity(currentTitle, series.title);
            if (similarity > 0.4) { // 40% similarity threshold
                similarSeries.push({ series, similarity });
            }
        }
        if (similarSeries.length > 0) {
            console.log(`  🤔 Found ${similarSeries.length} potentially related series through similarity`);
            // Sort by similarity and get the earliest year for each series
            similarSeries.sort((a, b) => b.similarity - a.similarity);
            for (const { series, similarity } of similarSeries) {
                const years = series.animes.map(a => a.year).filter(Boolean);
                const earliestYear = years.length > 0 ? Math.min(...years) : null;
                console.log(`    📺 "${series.title}" (${earliestYear || 'Unknown'}) - similarity: ${similarity.toFixed(2)}`);
                // Calculate word-based substring match percentage
                function calculateWordBasedMatch(title1, title2) {
                    // Split into words and clean them
                    function getWords(title) {
                        return title
                            .toLowerCase()
                            .replace(/[°':!?.,()-]/g, ' ')
                            .split(/\s+/)
                            .filter(word => word.length > 0);
                    }
                    const words1 = getWords(title1);
                    const words2 = getWords(title2);
                    // Find which has fewer words (shorter)
                    const shorterWords = words1.length <= words2.length ? words1 : words2;
                    const longerWords = words1.length <= words2.length ? words2 : words1;
                    // Count how many words from shorter are contained in longer
                    const matchedWords = shorterWords.filter(word => longerWords.some(longerWord => longerWord.includes(word) || word.includes(longerWord)));
                    // Return percentage of shorter title's words that match
                    return shorterWords.length > 0 ? matchedWords.length / shorterWords.length : 0;
                }
                const substringMatchPercentage = calculateWordBasedMatch(currentTitle, series.title);
                console.log(`    🔍 Word match: ${(substringMatchPercentage * 100).toFixed(1)}%`);
                // Only auto-assign if:
                // 1. High core word similarity (>80%)  
                // 2. AND perfect word match (100%) - only when all words from shorter title are in longer
                // 3. AND shorter title has ≤2 words (to avoid complex cases)
                const shorterWordCount = Math.min(currentTitle.split(/\s+/).length, series.title.split(/\s+/).length);
                const isSimpleCase = substringMatchPercentage >= 1.0 && shorterWordCount <= 2;
                if (similarity > 0.8 && isSimpleCase) {
                    let shouldRename = false;
                    let reason = '';
                    if (currentYear && earliestYear && currentYear < earliestYear) {
                        shouldRename = true;
                        reason = 'current anime is older';
                    }
                    else if (currentTitle.length < series.title.length && currentSeriesType === 'main') {
                        shouldRename = true;
                        reason = 'current title is more generic';
                    }
                    else {
                        shouldRename = false;
                        reason = 'adding to existing series';
                    }
                    if (shouldRename) {
                        console.log(`    🔄 Auto-renaming series to "${currentTitle}" (${reason}, similarity: ${similarity.toFixed(2)})`);
                        await prisma.animeSeries.update({
                            where: { id: series.id },
                            data: {
                                title: animeData.title,
                                titleEnglish: animeData.title_english,
                                titleJapanese: animeData.title_japanese,
                                isMainEntry: true,
                                description: animeData.synopsis || series.description,
                                imageUrl: animeData.images.jpg.large_image_url || series.imageUrl
                            }
                        });
                        console.log(`    ✅ Renamed series from "${series.title}" to "${currentTitle}"`);
                    }
                    else {
                        console.log(`    ✅ Auto-adding to existing series "${series.title}" (${reason}, similarity: ${similarity.toFixed(2)})`);
                    }
                    return series.id;
                }
                else if (similarity > 0.4) {
                    console.log(`    🤔 High similarity (${similarity.toFixed(2)}) but complex case - will ask user`);
                    // Add this series to complex cases that need user decision
                    const years = series.animes.map(a => a.year).filter(Boolean);
                    const earliestYear = years.length > 0 ? Math.min(...years) : null;
                    // Present user choice for this complex case
                    console.log(`\n🎬 Processing: "${currentTitle}" (${currentYear || 'Unknown'})`);
                    console.log(`📝 Found complex similarity match. What should we do?\n`);
                    console.log(`0️⃣  Create new series: "${currentTitle}"`);
                    console.log(`1️⃣  Add to existing: "${series.title}" (${earliestYear || 'Unknown'})`);
                    console.log(`2️⃣  Rename "${series.title}" → "${currentTitle}" and add (${earliestYear || 'Unknown'} → ${currentYear || 'Unknown'})`);
                    const choice = await askUser('\nYour choice (number): ');
                    const choiceNum = parseInt(choice);
                    if (choiceNum === 1) {
                        console.log(`    ✅ Adding to existing series: "${series.title}"`);
                        return series.id;
                    }
                    else if (choiceNum === 2) {
                        console.log(`    🔄 Renaming series from "${series.title}" to "${currentTitle}"`);
                        await prisma.animeSeries.update({
                            where: { id: series.id },
                            data: {
                                title: animeData.title,
                                titleEnglish: animeData.title_english,
                                titleJapanese: animeData.title_japanese,
                                isMainEntry: true,
                                description: animeData.synopsis || series.description,
                                imageUrl: animeData.images.jpg.large_image_url || series.imageUrl
                            }
                        });
                        console.log(`    ✅ Renamed series to "${currentTitle}"`);
                        return series.id;
                    }
                    else {
                        console.log(`    ✅ Creating new series as requested`);
                        // Continue to create new series
                    }
                }
            }
        }
        // Always check for partial matches if no high-similarity matches were processed
        if (similarSeries.length === 0) {
            console.log(`    ⚠️  No high similarity matches found, checking for partial matches...`);
            // Check for partial matches that might need user input
            const partialMatches = [];
            for (const series of allSeries) {
                const seriesCore = extractCoreWords(series.title);
                const currentCore = extractCoreWords(currentTitle);
                // Check if any core words from either title appear in the other, OR simple substring match
                const hasSharedCoreWords = seriesCore.some(word => currentCore.includes(word) || currentTitle.toLowerCase().includes(word)) || currentCore.some(word => seriesCore.includes(word) || series.title.toLowerCase().includes(word)) || (
                // Simple substring check for cases like "Gintama" in "Gintama. Shirogane..."
                currentTitle.toLowerCase().includes(series.title.toLowerCase()) ||
                    series.title.toLowerCase().includes(currentTitle.toLowerCase()));
                if (hasSharedCoreWords) {
                    const years = series.animes.map(a => a.year).filter(Boolean);
                    const earliestYear = years.length > 0 ? Math.min(...years) : null;
                    partialMatches.push({ series, earliestYear });
                }
            }
            if (partialMatches.length > 0) {
                console.log(`    🤔 Found ${partialMatches.length} series with shared core words, asking user...`);
                // Present options to user
                console.log(`\n🎬 Processing: "${currentTitle}" (${currentYear || 'Unknown'})`);
                console.log(`📝 Found potentially related series. What should we do?\n`);
                // Option 0: Create new series
                console.log(`0️⃣  Create new series: "${currentTitle}"`);
                // Options 1+: Add to existing series
                partialMatches.forEach(({ series, earliestYear }, index) => {
                    console.log(`${index + 1}️⃣  Add to existing: "${series.title}" (${earliestYear || 'Unknown'})`);
                });
                // Rename options
                partialMatches.forEach(({ series, earliestYear }, index) => {
                    const optionNum = partialMatches.length + 1 + index;
                    console.log(`${optionNum}️⃣  Rename "${series.title}" → "${currentTitle}" and add (${earliestYear || 'Unknown'} → ${currentYear || 'Unknown'})`);
                });
                const choice = await askUser('\nYour choice (number): ');
                const choiceNum = parseInt(choice);
                if (choiceNum === 0) {
                    console.log(`    ✅ Creating new series as requested`);
                }
                else if (choiceNum >= 1 && choiceNum <= partialMatches.length) {
                    // Add to existing series
                    const selectedSeries = partialMatches[choiceNum - 1].series;
                    console.log(`    ✅ Adding to existing series: "${selectedSeries.title}"`);
                    return selectedSeries.id;
                }
                else if (choiceNum > partialMatches.length && choiceNum <= partialMatches.length * 2) {
                    // Rename series
                    const selectedSeries = partialMatches[choiceNum - partialMatches.length - 1].series;
                    console.log(`    🔄 Renaming series from "${selectedSeries.title}" to "${currentTitle}"`);
                    await prisma.animeSeries.update({
                        where: { id: selectedSeries.id },
                        data: {
                            title: animeData.title,
                            titleEnglish: animeData.title_english,
                            titleJapanese: animeData.title_japanese,
                            isMainEntry: true,
                            description: animeData.synopsis || selectedSeries.description,
                            imageUrl: animeData.images.jpg.large_image_url || selectedSeries.imageUrl
                        }
                    });
                    console.log(`    ✅ Renamed series to "${currentTitle}"`);
                    return selectedSeries.id;
                }
                else {
                    console.log(`    ⚠️  Invalid choice, creating new series`);
                }
            }
        }
        // Create new series
        const seriesType = (0, series_detection_1.determineSeriesType)(animeData);
        const isMainEntry = seriesType === 'main' || seriesType === 'sequel';
        // For series title, clean up the main anime title
        let seriesTitle = animeData.title;
        if (seriesType !== 'main') {
            // Try to extract a cleaner series title
            seriesTitle = seriesTitle.replace(/:\s*season\s*\d+/i, '');
            seriesTitle = seriesTitle.replace(/\s*season\s*\d+/i, '');
            seriesTitle = seriesTitle.replace(/\s*\d+(?:st|nd|rd|th)\s*season/i, '');
            seriesTitle = seriesTitle.replace(/\s+(II|III|IV|V|VI|VII|VIII|IX|X)$/i, '');
            seriesTitle = seriesTitle.replace(/\s*:\s*/, ': ');
            seriesTitle = seriesTitle.trim();
        }
        const newSeries = await prisma.animeSeries.create({
            data: {
                title: seriesTitle,
                titleEnglish: animeData.title_english,
                titleJapanese: animeData.title_japanese,
                description: animeData.synopsis,
                imageUrl: animeData.images.jpg.large_image_url,
                status: animeData.status === 'Finished Airing' ? 'completed' :
                    animeData.status === 'Currently Airing' ? 'ongoing' : 'upcoming',
                startYear: animeData.year,
                endYear: animeData.year,
                totalEpisodes: animeData.episodes,
                averageScore: animeData.score,
                popularity: animeData.popularity,
                isMainEntry
            }
        });
        console.log(`  ✨ Created new series: ${newSeries.title}`);
        return newSeries.id;
    }
    catch (error) {
        console.error('Error finding/creating series:', error);
        return null;
    }
}
// Import a single anime with series detection
async function importAnimeWithSeries(malId) {
    var _a, _b, _c, _d;
    try {
        // Check if anime already exists
        const existingAnime = await prisma.anime.findUnique({
            where: { malId },
        });
        if (existingAnime) {
            console.log(`Anime with MAL ID ${malId} already exists`);
            return true;
        }
        // Fetch anime data
        const response = await axios_1.default.get(`https://api.jikan.moe/v4/anime/${malId}/full`);
        const animeData = response.data.data;
        // Find or create series for this anime
        const seriesId = await findOrCreateSeries(animeData);
        // Determine series-specific properties
        const seriesType = (0, series_detection_1.determineSeriesType)(animeData);
        const seriesOrder = (0, series_detection_1.determineSeriesOrder)(animeData, animeData.relations || []);
        // Create the anime record
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
                airedFrom: animeData.aired.from ? new Date(animeData.aired.from) : null,
                airedTo: animeData.aired.to ? new Date(animeData.aired.to) : null,
                broadcastDay: ((_a = animeData.broadcast) === null || _a === void 0 ? void 0 : _a.day) || null,
                broadcastTime: ((_b = animeData.broadcast) === null || _b === void 0 ? void 0 : _b.time) || null,
                broadcastTimezone: ((_c = animeData.broadcast) === null || _c === void 0 ? void 0 : _c.timezone) || null,
                imageUrl: animeData.images.jpg.large_image_url,
                trailerUrl: ((_d = animeData.trailer) === null || _d === void 0 ? void 0 : _d.url) || null,
                seriesType,
                seriesOrder,
            },
        });
        // Create genres (existing logic)
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
        // Create studios (existing logic)
        if (animeData.studios) {
            for (const studioData of animeData.studios) {
                const studio = await prisma.studio.upsert({
                    where: { malId: studioData.mal_id },
                    create: { malId: studioData.mal_id, name: studioData.name },
                    update: { name: studioData.name },
                });
                await prisma.animeStudios.create({
                    data: { animeId: anime.id, studioId: studio.id },
                });
            }
        }
        // Create producers (existing logic)
        if (animeData.producers) {
            for (const producerData of animeData.producers) {
                const producer = await prisma.producer.upsert({
                    where: { malId: producerData.mal_id },
                    create: { malId: producerData.mal_id, name: producerData.name },
                    update: { name: producerData.name },
                });
                await prisma.animeProducers.create({
                    data: { animeId: anime.id, producerId: producer.id },
                });
            }
        }
        // Create streaming links (existing logic)
        if (animeData.streaming) {
            for (const streamingData of animeData.streaming) {
                await prisma.animeStreaming.create({
                    data: {
                        animeId: anime.id,
                        platformName: streamingData.name,
                        url: streamingData.url,
                    },
                });
            }
        }
        // Create external links (existing logic)
        if (animeData.external) {
            for (const externalData of animeData.external) {
                await prisma.animeExternalLinks.create({
                    data: {
                        animeId: anime.id,
                        name: externalData.name,
                        url: externalData.url,
                    },
                });
            }
        }
        // Create relations (existing logic)
        if (animeData.relations) {
            for (const relationGroup of animeData.relations) {
                for (const entry of relationGroup.entry) {
                    if (entry.type === 'anime') {
                        await prisma.animeRelations.create({
                            data: {
                                animeId: anime.id,
                                relatedMalId: entry.mal_id,
                                relationType: relationGroup.relation,
                            },
                        });
                    }
                }
            }
        }
        // Create themes (existing logic)
        if (animeData.theme) {
            // Process openings
            if (animeData.theme.openings) {
                for (const [index, opening] of animeData.theme.openings.entries()) {
                    const [title, artist] = parseTheme(opening);
                    await prisma.animeThemes.create({
                        data: {
                            animeId: anime.id,
                            type: 'opening',
                            number: index + 1,
                            title,
                            artist,
                        },
                    });
                }
            }
            // Process endings
            if (animeData.theme.endings) {
                for (const [index, ending] of animeData.theme.endings.entries()) {
                    const [title, artist] = parseTheme(ending);
                    await prisma.animeThemes.create({
                        data: {
                            animeId: anime.id,
                            type: 'ending',
                            number: index + 1,
                            title,
                            artist,
                        },
                    });
                }
            }
        }
        // Update series statistics if we created/used a series
        if (seriesId) {
            await updateSeriesStatistics(seriesId);
        }
        console.log(`Successfully imported anime: ${anime.title} (Series: ${seriesType}, Order: ${seriesOrder})`);
        return true;
    }
    catch (error) {
        console.error(`Error importing anime ${malId}:`, error);
        return false;
    }
}
// Update series statistics based on its anime
async function updateSeriesStatistics(seriesId) {
    try {
        const animeInSeries = await prisma.anime.findMany({
            where: { seriesId }
        });
        if (animeInSeries.length === 0)
            return;
        const totalEpisodes = animeInSeries.reduce((sum, a) => sum + (a.episodes || 0), 0);
        const averageScore = animeInSeries.reduce((sum, a) => sum + (a.score || 0), 0) / animeInSeries.length;
        const averagePopularity = animeInSeries.reduce((sum, a) => sum + (a.popularity || 0), 0) / animeInSeries.length;
        const years = animeInSeries.map(a => a.year).filter(Boolean);
        const startYear = years.length > 0 ? Math.min(...years) : null;
        const endYear = years.length > 0 ? Math.max(...years) : null;
        // Determine series status
        const hasOngoing = animeInSeries.some(a => a.status === 'Currently Airing');
        const hasCompleted = animeInSeries.some(a => a.status === 'Finished Airing');
        const status = hasOngoing ? 'ongoing' : hasCompleted ? 'completed' : 'upcoming';
        await prisma.animeSeries.update({
            where: { id: seriesId },
            data: {
                totalEpisodes,
                averageScore,
                popularity: Math.round(averagePopularity),
                startYear,
                endYear,
                status
            }
        });
    }
    catch (error) {
        console.error('Error updating series statistics:', error);
    }
}
// Helper function to parse theme strings (existing logic)
function parseTheme(theme) {
    const match = theme.match(/(?:\d+: )?"([^"]+)"(?: by (.+?))?(?:\s*\(|$)/);
    if (match) {
        return [match[1], match[2] || null];
    }
    return [theme, null];
}
// Main import function
async function importAllAnimeWithSeries() {
    const progress = loadProgress();
    console.log(`🚀 Starting continuous enhanced anime import with series detection`);
    console.log(`📊 Resuming from page ${progress.currentPage}`);
    console.log(`⚠️  This will run continuously until manually stopped (Ctrl+C)`);
    console.log(`📝 Progress is saved automatically and can be resumed if interrupted`);
    try {
        while (true) {
            // Fetch page of top anime
            const response = await axios_1.default.get(`https://api.jikan.moe/v4/top/anime?page=${progress.currentPage}`);
            const { data, pagination } = response.data;
            console.log(`\n📄 Processing page ${progress.currentPage} of ${pagination.last_visible_page}`);
            // Process each anime on the page
            for (const anime of data) {
                if (!progress.processedIds.includes(anime.mal_id)) {
                    await delay(DELAY_BETWEEN_REQUESTS);
                    console.log(`\n🎬 Processing #${progress.processedIds.length + 1}: ${anime.title} (MAL ID: ${anime.mal_id})`);
                    const success = await importAnimeWithSeries(anime.mal_id);
                    if (success) {
                        progress.processedIds.push(anime.mal_id);
                    }
                    else {
                        progress.failedIds.push(anime.mal_id);
                    }
                    saveProgress(progress);
                    // Show progress every 10 anime
                    if (progress.processedIds.length % 10 === 0) {
                        console.log(`\n📊 Progress Update: ${progress.processedIds.length} anime processed so far`);
                    }
                }
            }
            // Move to next page
            progress.currentPage++;
            saveProgress(progress);
            // Check if we've processed all pages
            if (progress.currentPage > pagination.last_visible_page) {
                break;
            }
            // Add delay between pages
            await delay(DELAY_BETWEEN_REQUESTS);
        }
        console.log('\n🎉 Enhanced import completed (all pages processed)!');
        console.log(`📊 Final Statistics:`);
        console.log(`   • Processed ${progress.processedIds.length} anime successfully`);
        console.log(`   • Failed to process ${progress.failedIds.length} anime`);
        // Show series statistics
        const totalSeries = await prisma.animeSeries.count();
        const totalAnime = await prisma.anime.count();
        console.log(`   • Total series in database: ${totalSeries}`);
        console.log(`   • Total anime in database: ${totalAnime}`);
    }
    catch (error) {
        console.error('❌ Error during enhanced import:', error);
        throw error;
    }
    finally {
        rl.close();
        await prisma.$disconnect();
    }
}
// Start the enhanced import
if (require.main === module) {
    importAllAnimeWithSeries().catch(console.error);
}
