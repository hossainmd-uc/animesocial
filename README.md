# 🎌 Anime Social Hub

A modern social media platform for anime fans to connect, track their anime journey, and discover new favorites.

## Features

### Phase 1: Core Social Foundation (Current)
- ✅ **User Authentication** - Secure login system with email/password and Google OAuth integration for seamless onboarding
- ✅ **Rich User Profiles** - Customizable profiles featuring favorite anime, bio, avatar, and personal anime preferences showcase
- 🚧 **Anime Database Integration** - Integration with MyAnimeList API for comprehensive anime data including ratings, genres, studio info, and episode details
- 🚧 **Personal Tracking Lists** - Individual anime lists for "Watching", "Completed", "Plan to Watch", "On Hold", and "Dropped" with progress tracking and personal ratings

### Phase 2: Social Discovery Engine (Planned)
- 🚧 **Smart Anime Recommendations** - AI-powered personalized anime discovery using collaborative filtering and content analysis to suggest shows you'll love
- 🚧 **Community Content Discovery** - Find interesting people through their anime reviews, lists, fan theories, and creative content rather than algorithmic matching
- 🚧 **Natural Interaction Systems** - Low-pressure ways to engage: reactions, bookmarking content, and direct messaging for deeper conversations

### Phase 3: Dynamic Community Hubs (Planned)
- 🚧 **Living Community Hubs per anime** - Dynamic discussion spaces for each anime series with real-time updates, fan art galleries, theory discussions, and community-driven content
- 🚧 **Episode Live-Lounges** - Real-time chat rooms that open during episode air times, with built-in spoiler protection and synchronized discussion threads
- 🚧 **Watch Party Coordination** - Tools to organize synchronized viewing sessions with friends, complete with video sync, voice chat integration, and shared reactions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account

### 1. Clone and Install

```bash
git clone <your-repo>
cd anime-social-app
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `database/schema.sql` to create the profiles table and setup RLS policies

### 5. Configure Authentication (Optional)

For Google OAuth:
1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Protected dashboard
│   └── layout.tsx      # Root layout
├── components/
│   ├── auth/           # Auth components
│   └── profile/        # Profile components
├── lib/
│   └── supabase/       # Supabase configuration
└── middleware.ts       # Auth middleware
```

## Database Schema

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  favorite_anime TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Development Roadmap

- [ ] **Phase 1**: Complete core social foundation
  - [ ] **Anime Database Integration** - Connect with MyAnimeList API for real-time anime data, ratings, and metadata
  - [ ] **Personal Tracking Lists** - Build comprehensive anime tracking system with status updates and progress logging
  - [ ] **Episode-level Progress Logging** - Granular tracking of episode viewing with timestamps and notes
  - [ ] **Advanced Profile Customization** - Custom themes, badges, and anime milestone achievements
  
- [ ] **Phase 2**: Build social discovery engine
  - [ ] **Smart Anime Recommendations** - Develop AI recommendation engine using collaborative filtering for personalized anime discovery
  - [ ] **Community Content System** - Build review, rating, and list sharing features where users naturally discover each other through quality content
  - [ ] **Natural Interaction Tools** - Implement reactions, bookmarking, and streamlined direct messaging system
  - [ ] **Content Discovery Feed** - Curated feed showing interesting reviews, lists, and discussions from the community rather than algorithmic friend suggestions
  - [ ] **Interest-Based Groupings** - Optional communities around specific anime, genres, or activities (join/leave freely, no algorithm required)
  
- [ ] **Phase 3**: Launch community features
  - [ ] **Living Community Hubs** - Real-time discussion boards with moderation tools and content curation
  - [ ] **Episode Live-Lounges** - Synchronized chat rooms with spoiler tags and reaction tracking
  - [ ] **Watch Party Coordination** - Video synchronization engine with voice/text chat integration
  - [ ] **Community Events** - Anime tournament brackets, seasonal watch challenges, and fan art contests

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for the anime community
