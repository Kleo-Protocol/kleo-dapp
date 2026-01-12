/**
 * Gets the site URL for the application.
 * Uses NEXT_PUBLIC_SITE_URL environment variable if set,
 * otherwise falls back to window.location.origin (for development).
 */
export function getSiteUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default to production URL
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://dapp.kleo.finance';
  }

  // Client-side: use environment variable if set, otherwise use current origin
  return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
}
