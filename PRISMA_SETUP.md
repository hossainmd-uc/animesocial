# Django-like Database Management with Prisma + Supabase

## What This Gives You

Instead of writing raw SQL like this:
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  -- etc...
);
```

You can now define models in TypeScript like Django:
```typescript
model Profile {
  id          String   @id @db.Uuid
  username    String?  @unique
  fullName    String?  @map("full_name")
  bio         String?
  // etc...
}
```

## Setup Instructions

1. **Environment Variables**: Add these to your `.env.local`:
```env
# Get these from your Supabase project settings
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

2. **Sync with Existing Database**:
```bash
npx prisma db pull
npx prisma generate
```

## Usage Examples

### Query Data (Django-like!)
```typescript
import { ProfileService } from '@/lib/profile-service'

// Get a profile - clean and type-safe
const profile = await ProfileService.getProfile(userId)

// Search profiles with complex queries
const results = await ProfileService.searchProfiles("naruto")

// Pagination made easy
const { profiles, total, pages } = await ProfileService.getRecentProfiles(1, 20)
```

### Compare with Raw Supabase
```typescript
// OLD WAY (Raw Supabase)
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', id)
  .single()
if (error) throw error

// NEW WAY (Prisma)
const profile = await prisma.profile.findUnique({
  where: { id }
})
```

## Key Benefits

- **Type Safety**: Full TypeScript support with auto-completion
- **Readable Code**: Clean, Django-like syntax
- **Migrations**: Version control your database changes
- **Relationships**: Easy to define and query related data
- **Advanced Queries**: Complex filtering, sorting, pagination built-in

## Next Steps

1. Update your `.env.local` with your Supabase credentials
2. Run `npx prisma db pull` to sync your existing schema
3. Start using `ProfileService` instead of raw Supabase queries
4. Add new models to `prisma/schema.prisma` as your app grows

## Future Model Examples

When you want to add posts, comments, anime lists, etc., you can define them in the schema:

```typescript
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  authorId  String   @map("author_id") @db.Uuid
  author    Profile  @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("posts")
}
```

Much more maintainable than raw SQL! 