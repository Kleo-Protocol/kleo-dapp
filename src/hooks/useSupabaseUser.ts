'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get client inside effect to ensure it's only called on mount
    let supabase;
    try {
      supabase = createClient();
    } catch (error) {
      logger.error('Error creating Supabase client', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
      return;
    }

    const init = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (error) {
          logger.error('Error getting user', { error: error.message }, error);
          setUser(null);
        } else {
          setUser(user ?? null);
        }
        setLoading(false);
      } catch (error) {
        logger.error('Error getting user', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty deps - only run once on mount

  return { user, loading };
}