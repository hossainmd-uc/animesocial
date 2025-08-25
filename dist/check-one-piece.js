"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkOnePiece() {
    console.log('🔍 Checking One Piece entries in database...\n');
    // Find all One Piece related anime
    const onePieceAnime = await prisma.anime.findMany({
        where: {
            title: {
                contains: 'One Piece',
                mode: 'insensitive'
            }
        },
        include: {
            series: true
        },
        orderBy: {
            year: 'asc'
        }
    });
    console.log(`Found ${onePieceAnime.length} One Piece anime entries:`);
    for (const anime of onePieceAnime) {
        console.log(`📺 ${anime.title} (${anime.year}) - Type: ${anime.seriesType}`);
        if (anime.series) {
            console.log(`   └─ Series: "${anime.series.title}" (isMainEntry: ${anime.series.isMainEntry})`);
        }
        else {
            console.log(`   └─ No series assigned`);
        }
    }
    // Find all series with One Piece in the title
    console.log('\n🗂️ One Piece series:');
    const onePieceSeries = await prisma.animeSeries.findMany({
        where: {
            title: {
                contains: 'One Piece',
                mode: 'insensitive'
            }
        },
        include: {
            animes: {
                select: {
                    title: true,
                    year: true
                }
            }
        }
    });
    for (const series of onePieceSeries) {
        console.log(`📁 Series: "${series.title}" (isMainEntry: ${series.isMainEntry})`);
        console.log(`   Contains ${series.animes.length} anime:`);
        for (const anime of series.animes) {
            console.log(`   - ${anime.title} (${anime.year})`);
        }
    }
    await prisma.$disconnect();
}
checkOnePiece().catch(console.error);
