// Unified Profile type that matches Prisma model
export interface Profile {
  id: string
  username: string
  displayName?: string | null
  bio?: string | null
  favoriteAnime?: string | null
  avatarUrl?: string | null
  status?: string | null
  createdAt: Date
  updatedAt: Date
} 