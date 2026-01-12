import { createClient } from '@/utils/supabase/client';
import { getSiteUrl } from '@/utils/url';

interface SignUpData {
  email: string;
  password: string;
  name: string;
  surname: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface SignUpResponse {
  success: boolean;
  session?: { access_token: string };
  error?: string;
  requiresEmailConfirmation?: boolean;
}

interface SignInResponse {
  success: boolean;
  session?: { access_token: string };
  error?: string;
}

export async function signUp(data: SignUpData): Promise<SignUpResponse> {
  try {
    const supabase = createClient();

    // 1) Create user in Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
      },
    });

    if (signUpError) {
      return {
        success: false,
        error: signUpError.message,
      };
    }

    const session = authData.session;

    if (!session) {
      return {
        success: false,
        requiresEmailConfirmation: true,
        error: 'Please check your email to confirm your account.',
      };
    }

    // 2) Create profile in our API (Prisma)
    const resp = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: data.name,
        surname: data.surname,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json();
      return {
        success: false,
        error: errorData.error || 'Failed to create profile.',
      };
    }

    return {
      success: true,
      session: {
        access_token: session.access_token,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during sign up',
    };
  }
}

export async function signIn(data: SignInData): Promise<SignInResponse> {
  try {
    const supabase = createClient();

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      return {
        success: false,
        error: signInError.message,
      };
    }

    if (!authData.session) {
      return {
        success: false,
        error: 'No session created. Please try again.',
      };
    }

    return {
      success: true,
      session: {
        access_token: authData.session.access_token,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during sign in',
    };
  }
}

export async function signInWithGoogle(redirectTo?: string): Promise<{ error?: string }> {
  try {
    const supabase = createClient();

    const callbackUrl = redirectTo || `${getSiteUrl()}/auth/callback?next=/dashboard`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred during Google sign in',
    };
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}