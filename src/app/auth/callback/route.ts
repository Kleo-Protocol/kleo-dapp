import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/dashboard';

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(new URL('/signin?error=missing_code', requestUrl.origin));
    }

    const supabase = await createClient();
    
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin));
    }

    // Check if user has a profile, if not create one
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(userError.message)}`, requestUrl.origin));
    }

    if (user && user.email) {
      try {
        const existingProfile = await prisma.userProfile.findUnique({
          where: { userId: user.id },
        });

        if (!existingProfile) {
          // Extract name from user metadata or email
          const nameParts = user.user_metadata?.full_name?.split(' ') || [];
          const name = nameParts[0] || '';
          const surname = nameParts.slice(1).join(' ') || '';

          // Create profile if it doesn't exist
          await prisma.userProfile.upsert({
            where: { userId: user.id },
            update: {
              email: user.email,
            },
            create: {
              userId: user.id,
              name: name || user.email.split('@')[0],
              surname: surname || '',
              email: user.email,
            },
          });
        }
      } catch (prismaError) {
        console.error('Error creating/updating profile:', prismaError);
        // Don't fail the auth flow if profile creation fails
        // User can update profile later
      }
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(
      new URL(
        `/signin?error=${encodeURIComponent(error instanceof Error ? error.message : 'An unexpected error occurred')}`,
        requestUrl.origin,
      ),
    );
  }
}