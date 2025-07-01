"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
async function importAnime(malId) {
    try {
        // Check if anime already exists
        const existingAnime = await prisma.anime.findUnique({
            where: { malId },
        });
        if (existingAnime) {
            console.log(`Anime with MAL ID ${malId} already exists`);
            return;
        }
        // Fetch anime data from Jikan API
        const response = await axios_1.default.get(`https://api.jikan.moe/v4/anime/${malId}/full`);
        const animeData = response.data.data;
        // Create the anime record
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
        // Create genres
        if (animeData.genres) {
            for (const genreData of animeData.genres) {
                // Create or find genre
                const genre = await prisma.genre.upsert({
                    where: { malId: genreData.mal_id },
                    create: {
                        malId: genreData.mal_id,
                        name: genreData.name,
                    },
                    update: {
                        name: genreData.name,
                    },
                });
                // Create association
                await prisma.animeGenres.create({
                    data: {
                        animeId: anime.id,
                        genreId: genre.id,
                    },
                });
            }
        }
        // Create studios
        if (animeData.studios) {
            for (const studioData of animeData.studios) {
                const studio = await prisma.studio.upsert({
                    where: { malId: studioData.mal_id },
                    create: {
                        malId: studioData.mal_id,
                        name: studioData.name,
                    },
                    update: {
                        name: studioData.name,
                    },
                });
                await prisma.animeStudios.create({
                    data: {
                        animeId: anime.id,
                        studioId: studio.id,
                    },
                });
            }
        }
        // Create producers
        if (animeData.producers) {
            for (const producerData of animeData.producers) {
                const producer = await prisma.producer.upsert({
                    where: { malId: producerData.mal_id },
                    create: {
                        malId: producerData.mal_id,
                        name: producerData.name,
                    },
                    update: {
                        name: producerData.name,
                    },
                });
                await prisma.animeProducers.create({
                    data: {
                        animeId: anime.id,
                        producerId: producer.id,
                    },
                });
            }
        }
        // Create streaming links
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
        // Create external links
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
        // Create relations
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
        // Create themes (openings and endings)
        if (animeData.theme) {
            // Process openings
            if (animeData.theme.openings) {
                animeData.theme.openings.forEach(async (opening, index) => {
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
                });
            }
            // Process endings
            if (animeData.theme.endings) {
                animeData.theme.endings.forEach(async (ending, index) => {
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
                });
            }
        }
        console.log(`Successfully imported anime: ${anime.title}`);
        return anime;
    }
    catch (error) {
        console.error('Error importing anime:', error);
        throw error;
    }
}
// Helper function to parse theme strings
function parseTheme(theme) {
    // Format is usually: "1: \"Song Name\" by Artist (eps X-Y)"
    const match = theme.match(/(?:\d+: )?\"([^\"]+)\"(?: by (.+?))?(?:\s*\(|$)/);
    if (match) {
        return [match[1], match[2] || null];
    }
    return [theme, null];
}
// Test the import with Frieren
async function main() {
    try {
        const frierenMalId = 52991;
        await importAnime(frierenMalId);
        console.log('Import completed successfully');
    }
    catch (error) {
        console.error('Import failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
