import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ProfileService } from '@/src/lib/profile-service'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Get the user and ensure profile exists
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          await ProfileService.ensureProfile(
            user.id,
            user.email || undefined,
            user.user_metadata
          )
          console.log('✅ Profile ensured for user:', user.email)
        } catch (error) {
          console.error('❌ Failed to create profile for user:', user.email, error)
          // Don't fail the auth flow if profile creation fails
        }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
} 