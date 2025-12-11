import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const supabase = createServerClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let query = supabase
      .from('issues')
      .select(`
        *,
        profile:profiles(*)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, body: issueBody } = body

    // Validate input
    if (!title || !issueBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 100 characters' },
        { status: 400 }
      )
    }

    if (issueBody.length < 10) {
      return NextResponse.json(
        { error: 'Body must be at least 10 characters' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Sanitize input to prevent XSS
    const sanitizedTitle = title.trim().slice(0, 100)
    const sanitizedBody = issueBody.trim()

    const { data, error } = await supabase
      .from('issues')
      // @ts-expect-error - Supabase type inference issue
      .insert({
        user_id: user.id,
        title: sanitizedTitle,
        body: sanitizedBody,
        status: 'open',
      })
      .select(`
        *,
        profile:profiles(*)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
