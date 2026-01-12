import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/dashboard';

    if (!code) {
      logger.error('No code provided in callback');
      return NextResponse.redirect(new URL('/signin?error=missing_code', requestUrl.origin));
    }

    // Use the same cookie handling approach as middleware to ensure cookies are properly set
    let response = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );
    
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      logger.error('Error exchanging code for session', { error: exchangeError.message }, exchangeError);
      return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin));
    }

    // Check if user has a profile, if not create one
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      logger.error('Error getting user', { error: userError.message }, userError);
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
        const error = prismaError instanceof Error ? prismaError : new Error(String(prismaError));
        logger.error('Error creating/updating profile', { error: error.message }, error);
        // Don't fail the auth flow if profile creation fails
        // User can update profile later
      }
    }

    // Redirect to dashboard (or specified next URL)
    // Cookies are already set by exchangeCodeForSession in the response object
    const redirectUrl = new URL(next, requestUrl.origin);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // Copy all cookies from the supabase response to the redirect response
    const cookies = response.cookies.getAll();
    cookies.forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    
    return redirectResponse;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Unexpected error in auth callback', { error: err.message }, err);
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(
      new URL(
        `/signin?error=${encodeURIComponent(err.message)}`,
        requestUrl.origin,
      ),
    );
  }
}