/**
 * Application-wide constants
 */

// Mock delays for simulating network requests (in milliseconds)
export const MOCK_DELAYS = {
  SHORT: 300,
  MEDIUM: 500,
  LONG: 1000,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  MOCK_USERS: 'kleo_mock_users',
} as const;

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

// Mock addresses for development/testing
// TODO: Remove these when real wallet integration is complete
export const MOCK_ADDRESSES = {
  DEFAULT: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
} as const;

// Mock values for UI components
export const MOCK_VALUES = {
  TOTAL_BACKED_TOKENS: BigInt(4500000000000000000), // 4.5 tokens
  ACTIVE_BACKS: 2,
  DEFAULTED_BACKS: 0,
} as const;
