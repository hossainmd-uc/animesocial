import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { StorageService } from '@/src/lib/supabase/storage'
import { ProfileService } from '@/src/lib/profile-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validation = StorageService.validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Upload to storage
    const uploadResult = await StorageService.uploadAvatar(supabase, file, user.id)
    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error }, { status: 500 })
    }

    // Update profile with new avatar URL
    const updatedProfile = await ProfileService.upsertProfile({
      id: user.id,
      avatarUrl: uploadResult.url
    })

    return NextResponse.json({ 
      success: true, 
      avatarUrl: uploadResult.url,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile to find avatar URL
    const profile = await ProfileService.getProfile(user.id)
    if (!profile?.avatarUrl) {
      return NextResponse.json({ error: 'No avatar to delete' }, { status: 400 })
    }

    // Delete from storage
    const deleteResult = await StorageService.deleteAvatar(supabase, profile.avatarUrl)
    if (!deleteResult.success) {
      console.error('Failed to delete avatar from storage:', deleteResult.error)
      // Continue anyway to clear the database reference
    }

    // Update profile to remove avatar URL
    const updatedProfile = await ProfileService.upsertProfile({
      id: user.id,
      avatarUrl: undefined
    })

    return NextResponse.json({ 
      success: true,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 