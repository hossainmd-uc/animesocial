import { SupabaseClient } from '@supabase/supabase-js'

export class StorageService {
  private static BUCKET_NAME = 'avatars'

  static async uploadAvatar(supabase: SupabaseClient, file: File, userId: string): Promise<{ url: string; error?: string }> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Replace if file exists
        })

      if (error) {
        console.error('Upload error:', error)
        return { url: '', error: error.message }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath)

      return { url: publicUrl }
    } catch (error) {
      console.error('Storage service error:', error)
      return { 
        url: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  static async deleteAvatar(supabase: SupabaseClient, url: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/')
      const bucketIndex = urlParts.findIndex(part => part === this.BUCKET_NAME)
      if (bucketIndex === -1) {
        return { success: false, error: 'Invalid avatar URL' }
      }

      const filePath = urlParts.slice(bucketIndex + 1).join('/')

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' }
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File must be JPEG, PNG, or WebP format' }
    }

    return { valid: true }
  }
} 