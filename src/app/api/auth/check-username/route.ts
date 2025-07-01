import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// GET /api/auth/check-username?username=example
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  // Basic username validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return NextResponse.json({ 
      available: false, 
      error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
    });
  }

  try {
    const existingProfile = await prisma.profile.findUnique({
      where: { username }
    });

    return NextResponse.json({ 
      available: !existingProfile,
      username 
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 