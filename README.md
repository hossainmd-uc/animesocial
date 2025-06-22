# 🎌 Anime Social Hub

A modern social media platform for anime fans to connect, track their anime journey, and discover new favorites.

## Features

### Phase 1: Core Social Foundation (Current)
- ✅ User Authentication (Email/Password + Google OAuth)
- ✅ Rich User Profiles with anime preferences
- 🚧 Anime Database Integration (Coming Soon)
- 🚧 Personal Tracking Lists (Coming Soon)

### Phase 2: Social Connection Engine (Planned)
- 🚧 Taste-Matching Algorithm
- 🚧 Automatic Taste-Clusters
- 🚧 Private Cluster Hubs

### Phase 3: Dynamic Community Hubs (Planned)
- 🚧 Living Community Hubs per anime
- 🚧 Episode Live-Lounges
- 🚧 Watch Party Coordination

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
  - [ ] Anime database integration (MyAnimeList API)
  - [ ] Personal tracking lists (Watching, Completed, Plan to Watch)
  - [ ] Episode-level progress logging
  
- [ ] **Phase 2**: Build social connection engine
  - [ ] Implement taste-matching algorithm
  - [ ] Create taste-clusters system
  - [ ] Build private cluster hubs
  
- [ ] **Phase 3**: Launch community features
  - [ ] Living community hubs per anime
  - [ ] Episode live-lounges with spoiler protection
  - [ ] Watch party coordination

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
