import { createClient } from './supabase/client';

const supabase = createClient();

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageUploadOptions {
  bucket: 'server' | 'post';
  folder: string; // user ID or post ID
  filename?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadImage(
  file: File,
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  try {
    // Validate file size
    const maxSize = options.maxSizeBytes || DEFAULT_MAX_SIZE;
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // Validate file type
    const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload an image file (JPEG, PNG, WebP, or GIF)'
      };
    }

    // Generate filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = options.filename || `image_${timestamp}.${extension}`;
    const filePath = `${options.folder}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        upsert: false, // Don't overwrite existing files
        contentType: file.type
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get URL based on bucket privacy
    let imageUrl: string;
    
    if (options.bucket === 'server') {
      // Server bucket is public - use public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    } else {
      // Post bucket is private - use signed URL (valid for 1 year)
      const { data: urlData, error: urlError } = await supabase.storage
        .from(options.bucket)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year
      
      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        return {
          success: false,
          error: 'Failed to create secure image URL'
        };
      }
      imageUrl = urlData.signedUrl;
    }

    return {
      success: true,
      url: imageUrl
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: 'Failed to upload image'
    };
  }
}

export async function deleteImage(
  bucket: 'server' | 'post',
  filePath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Image delete error:', error);
    return false;
  }
}

export function getImageUrl(bucket: 'server' | 'post', filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size (5MB limit)
  if (file.size > DEFAULT_MAX_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(DEFAULT_MAX_SIZE / 1024 / 1024)}MB`
    };
  }

  // Check file type
  if (!DEFAULT_ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload an image file (JPEG, PNG, WebP, or GIF)'
    };
  }

  return { valid: true };
}
