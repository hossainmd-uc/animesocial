import { prisma } from './prisma'
import { createClient } from './supabase/server'

// ===== PRISMA APPROACH (Django-like!) =====
export class ProfileService {
  // Get profile by ID - clean and type-safe
  static async getProfile(id: string) {
    try {
      return await Promise.race([
        prisma.profile.findUnique({
          where: { id }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
      ]);
    } catch (error) {
      console.error('ProfileService.getProfile: Database error:', error);
      return null;
    }
  }

  // Ensure profile exists for user - creates if needed
  static async ensureProfile(userId: string, userEmail?: string, userMetadata?: any) {
    try {
      const existingProfile = await Promise.race([
        prisma.profile.findUnique({
          where: { id: userId }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
      ]);

      if (existingProfile) {
        return existingProfile
      }

      // Create profile with data from signup
      const username = userMetadata?.username || userEmail?.split('@')[0] || `user_${userId.slice(0, 8)}`
      
      return await Promise.race([
        prisma.profile.create({
          data: {
            id: userId,
            username,
            displayName: userMetadata?.display_name || null,
            avatarUrl: userMetadata?.avatar_url || null,
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
      ]);
    } catch (error) {
      console.error('ProfileService.ensureProfile: Database error:', error);
      
      // Return a fallback profile when database is unreachable
      return {
        id: userId,
        username: userMetadata?.username || userEmail?.split('@')[0] || `user_${userId.slice(0, 8)}`,
        displayName: userMetadata?.display_name || null,
        bio: null,
        favoriteAnime: null,
        avatarUrl: userMetadata?.avatar_url || null,
        status: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
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
    avatarUrl?: string | null
    status?: string
  }) {
    console.log('ProfileService.upsertProfile: Input data:', data);
    
    try {
      // Convert undefined to null for proper database updates
      const cleanData = {
        displayName: data.displayName ?? null,
        bio: data.bio ?? null,
        favoriteAnime: data.favoriteAnime ?? null,
        avatarUrl: data.avatarUrl ?? null,
        status: data.status ?? null,
      }
      
      const result = await prisma.profile.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
          username: data.username || 'user_' + data.id.slice(0, 8),
          ...cleanData,
      },
      update: cleanData
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