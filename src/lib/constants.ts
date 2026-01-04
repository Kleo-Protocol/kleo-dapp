/**
 * Application-wide constants
 */

// Default values
export const DEFAULTS = {
  LOAN_DURATION_DAYS: 90,
  DECIMAL_PLACES: 18,
  REPUTATION_DIVISOR: 100,
} as const;

// Tier multipliers for borrowing calculations
export const TIER_MULTIPLIERS = {
  VERDE: 10,
  AMARILLO: 5,
  DEFAULT: 2,
} as const;

// Reputation calculation constants
export const REPUTATION_CONSTANTS = {
  BASE_MULTIPLIER: 1000,
} as const;

// Query stale times (in milliseconds)
export const QUERY_STALE_TIMES = {
  POOLS_LIST: 60000, // 1 minute
  POOLS_AVAILABLE: 30000, // 30 seconds
  POOL_DETAIL: 30000, // 30 seconds
  POOL_STATS: 60000, // 1 minute
} as const;
