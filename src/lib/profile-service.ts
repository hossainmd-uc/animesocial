import { prisma } from './prisma'
import { createClient } from './supabase/server'

// ===== PRISMA APPROACH (Django-like!) =====
export class ProfileService {
  // Get profile by ID - clean and type-safe
  static async getProfile(id: string) {
    return await prisma.profile.findUnique({
      where: { id }
    })
  }

  // Ensure profile exists for user - creates if needed
  static async ensureProfile(userId: string, userEmail?: string, userMetadata?: any) {
    const existingProfile = await prisma.profile.findUnique({
      where: { id: userId }
    })

    if (existingProfile) {
      return existingProfile
    }

    // Create profile with data from signup
    const username = userMetadata?.username || userEmail?.split('@')[0] || `user_${userId.slice(0, 8)}`
    
    return await prisma.profile.create({
      data: {
        id: userId,
        username,
        displayName: userMetadata?.display_name || null,
        avatarUrl: userMetadata?.avatar_url || null,
      }
    })
  }

  // Get profile by username - simple and readable
  static async getProfileByUsername(username: string) {
    return await prisma.profile.findUnique({
      where: { username }
    })
  }

  // Create or update profile - handles both cases elegantly
  static async upsertProfile(data: {
    id: string
    username?: string
    displayName?: string
    bio?: string
    favoriteAnime?: string
    avatarUrl?: string
    status?: string
  }) {
    console.log('ProfileService.upsertProfile: Input data:', data);
    
    try {
      const result = await prisma.profile.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          username: data.username || 'user_' + data.id.slice(0, 8),
          displayName: data.displayName,
          bio: data.bio,
          favoriteAnime: data.favoriteAnime,
          avatarUrl: data.avatarUrl,
          status: data.status,
        },
        update: {
          displayName: data.displayName,
          bio: data.bio,
          favoriteAnime: data.favoriteAnime,
          avatarUrl: data.avatarUrl,
          status: data.status,
        }
      });
      
      console.log('ProfileService.upsertProfile: Success result:', result);
      return result;
    } catch (error) {
      console.error('ProfileService.upsertProfile: Database error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        data: data,
        error: error
      });
      throw error;
    }
  }

  // Search profiles - powerful query builder
  static async searchProfiles(query: string, limit = 10) {
    return await prisma.profile.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  }

  // Get recent profiles with pagination
  static async getRecentProfiles(page = 1, limit = 20) {
    const skip = (page - 1) * limit
    
    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.profile.count()
    ])

    return {
      profiles,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    }
  }
}

// ===== COMPARISON: Raw Supabase approach (what you had before) =====
export class RawSupabaseProfileService {
  static async getProfile(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async searchProfiles(query: string, limit = 10) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(limit)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // You can see how much more verbose and error-prone this becomes!
} 