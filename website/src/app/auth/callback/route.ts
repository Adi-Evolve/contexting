import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
    }
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log('User authenticated successfully:', user.email)
      // Redirect back to home page after successful auth
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // If no code or authentication failed, redirect to home
  return NextResponse.redirect(new URL('/', request.url))
}
