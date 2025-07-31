# Anime Series Organization System

## Overview

This system solves the problem of unorganized anime data by grouping related anime (seasons, movies, OVAs, specials) into series during the import process. Instead of having isolated entries for "Attack on Titan Season 1", "Attack on Titan Season 2", etc., you'll have an "Attack on Titan" series containing all related entries.

## ✨ Features

### 🎯 **Series Detection**
- **Title Pattern Recognition**: Detects seasons, sequels, and parts using regex patterns
- **Relationship Analysis**: Uses MAL relationship data to group connected anime
- **Title Similarity**: Groups anime with similar base titles (80% similarity threshold)
- **Smart Classification**: Automatically categorizes as main, sequel, movie, OVA, special, etc.

### 📊 **Series Management**
- **Unified Cards**: Display series as single cards with expandable anime list
- **Progress Tracking**: Track progress across entire series or individual entries
- **Statistics**: Aggregate scores, episodes, and popularity across series
- **Status Tracking**: Series-level status (ongoing, completed, upcoming)

### 🔄 **Import Integration**
- **Real-time Detection**: Creates series during anime import process
- **Existing Data Organization**: Script to organize current anime into series
- **Relationship Updates**: Maintains series links as new related anime are imported

## 🗃️ Database Schema

### New Models

#### `AnimeSeries`
```prisma
model AnimeSeries {
  id             String   @id @default(cuid())
  title          String   // "Attack on Titan"
  titleEnglish   String?  
  titleJapanese  String?  
  description    String?  // Series overview
  imageUrl       String?  // Main series image
  status         String   @default("ongoing") // ongoing, completed, cancelled
  startYear      Int?     
  endYear        Int?     
  totalEpisodes  Int?     
  averageScore   Float?   
  popularity     Int?     
  isMainEntry    Boolean  @default(false)
  
  // Relationships
  animes         Anime[]
  userList       UserAnimeList[]
}
```

#### Enhanced `Anime` Model
```prisma
model Anime {
  // ... existing fields ...
  seriesId          String?  @map("series_id") // Link to series
  seriesOrder       Int?     @map("series_order") // 1, 2, 3...
  seriesType        String?  @map("series_type") // main, sequel, movie, ova, special
  
  // Relationships
  series            AnimeSeries? @relation(fields: [seriesId], references: [id])
}
```

#### Enhanced `UserAnimeList`
```prisma
model UserAnimeList {
  // ... existing fields ...
  animeId    String?      @map("anime_id")      // Individual anime entry
  seriesId   String?      @map("series_id")     // OR series-level tracking
  totalEpisodes Int?      @map("total_episodes") // For series progress tracking
  
  anime      Anime?       @relation(fields: [animeId], references: [id])
  series     AnimeSeries? @relation(fields: [seriesId], references: [id])
}
```

## 🚀 Implementation Steps

### 1. Apply Schema Changes

```bash
# Apply the new schema
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

### 2. Organize Existing Data

Run the organization script to group your current anime into series:

```bash
cd anime-social-app
npx ts-node scripts/organize-anime-series.ts
```

This will:
- ✅ Analyze all existing anime
- 🔍 Detect series relationships using titles and MAL relations
- 📺 Create series records for multi-anime groups
- 🔗 Link individual anime to their series
- 📊 Calculate series statistics

### 3. Use Enhanced Import for New Data

For future anime imports, use the enhanced script:

```bash
# Use the enhanced import script instead of the old one
npx ts-node scripts/enhanced-import-anime.ts
```

This will automatically:
- 🎯 Detect if new anime belongs to existing series
- ✨ Create new series for unrelated anime
- 🔄 Update series statistics as anime are added
- 📋 Maintain proper ordering and classification

## 🎨 Frontend Integration

### Series Card Component

Create a `SeriesCard` component that displays:

```tsx
interface SeriesCardProps {
  series: AnimeSeries & {
    animes: Anime[];
    _count: { animes: number };
  };
}

function SeriesCard({ series }) {
  return (
    <div className="series-card">
      <img src={series.imageUrl} alt={series.title} />
      <h3>{series.title}</h3>
      <p>{series._count.animes} entries • {series.totalEpisodes} episodes</p>
      <div className="series-status">{series.status}</div>
      
      {/* Expandable anime list */}
      <div className="anime-entries">
        {series.animes.map(anime => (
          <AnimeEntry key={anime.id} anime={anime} />
        ))}
      </div>
    </div>
  );
}
```

### API Endpoints

Create series-focused endpoints:

```typescript
// /api/series - Get all series with anime counts
// /api/series/[id] - Get series with all anime entries
// /api/series/[id]/progress - Update user progress for series
```

## 🔧 Series Detection Logic

### Title Pattern Detection
- **Seasons**: "Attack on Titan Season 2", "Naruto: Shippuden"
- **Numeric**: "Jojo's Bizarre Adventure 2", "Fate/Zero II"
- **Roman Numerals**: "Final Fantasy VII", "Kingdom Hearts III"
- **Parts**: "JoJo Part 1", "Lupin III: Part 6"

### Relationship Types
Groups anime with these MAL relationship types:
- `Sequel` / `Prequel`
- `Alternative version`
- `Side story`
- `Parent story` / `Full story`
- `Summary`

### Classification System
- **main**: Original series or first season
- **sequel**: Direct continuation (Season 2, Part 2)
- **prequel**: Takes place before main series
- **side_story**: Spin-offs and side stories
- **movie**: Theatrical releases
- **ova**: Original Video Animations
- **special**: Special episodes and shorts

## 📊 Example Results

After organization, instead of:
```
- Attack on Titan (2013)
- Attack on Titan Season 2 (2017)
- Attack on Titan Season 3 (2018)
- Attack on Titan: The Final Season (2020)
- Attack on Titan: No Regrets (OVA)
```

You get:
```
📺 Attack on Titan Series
   ├── 🎬 Attack on Titan (Season 1) - main, order: 1
   ├── 🎬 Attack on Titan Season 2 - sequel, order: 2
   ├── 🎬 Attack on Titan Season 3 - sequel, order: 3
   ├── 🎬 Attack on Titan: The Final Season - sequel, order: 4
   └── 🎞️ Attack on Titan: No Regrets - ova, order: 5
   
   Status: completed • 87 episodes • Score: 8.9/10
```

## 🎯 Benefits

1. **Cleaner UI**: Single cards for series instead of cluttered individual entries
2. **Better Discovery**: Users find complete series, not just random seasons
3. **Progress Tracking**: Track progress across entire franchises
4. **Logical Organization**: Related content grouped together naturally
5. **Scalability**: System handles new releases automatically

## 🔧 Maintenance

The system is self-maintaining:
- ✅ New anime automatically join existing series during import
- ✅ Series statistics update automatically
- ✅ Relationships are preserved and enhanced over time
- ✅ Manual series management tools available for edge cases

## 📝 Configuration

### Similarity Threshold
Adjust title similarity in `series-detection.ts`:
```typescript
if (similarity > 0.8) { // 80% similarity threshold
```

### Relationship Types
Modify which relationships create series links:
```typescript
const SERIES_RELATION_TYPES = [
  'Sequel', 'Prequel', 'Alternative version', 'Side story', 
  'Parent story', 'Full story', 'Summary'
];
```

### Classification Rules
Customize how anime types are determined in `determineSeriesType()` function.

---

🎉 **Your anime database will now be properly organized with series grouping, making it much easier to browse, discover, and track anime franchises!** 