/**
 * Loan tier definitions and utilities
 * 
 * Tiers determine the requirements (min stars, min vouchers) based on loan amount:
 * - Tier 1: 0-50 tokens, min stars: 5, min vouchers: 1
 * - Tier 2: 50-100 tokens, min stars: 20, min vouchers: 2
 * - Tier 3: 100-1000 tokens, min stars: 50, min vouchers: 3
 */

export type LoanTier = 1 | 2 | 3;

export interface TierRequirements {
  tier: LoanTier;
  minTokens: number;
  maxTokens: number;
  minStars: number;
  minVouchers: number;
}

export const LOAN_TIERS: Record<LoanTier, TierRequirements> = {
  1: {
    tier: 1,
    minTokens: 0,
    maxTokens: 50,
    minStars: 5,
    minVouchers: 1,
  },
  2: {
    tier: 2,
    minTokens: 50,
    maxTokens: 100,
    minStars: 20,
    minVouchers: 2,
  },
  3: {
    tier: 3,
    minTokens: 100,
    maxTokens: 1000,
    minStars: 50,
    minVouchers: 3,
  },
} as const;

/**
 * Get the loan tier for a given token amount
 * @param tokenAmount - The loan amount in tokens (human-readable number)
 * @returns The tier number (1, 2, or 3), or null if amount exceeds tier 3
 */
export function getLoanTier(tokenAmount: number): LoanTier | null {
  if (tokenAmount < 0) {
    return null;
  }
  
  if (tokenAmount < LOAN_TIERS[2].minTokens) {
    return 1;
  }
  
  if (tokenAmount < LOAN_TIERS[3].minTokens) {
    return 2;
  }
  
  if (tokenAmount <= LOAN_TIERS[3].maxTokens) {
    return 3;
  }
  
  // Amount exceeds tier 3 maximum
  return null;
}

/**
 * Get tier requirements for a given token amount
 * @param tokenAmount - The loan amount in tokens (human-readable number)
 * @returns Tier requirements or null if amount is invalid
 */
export function getTierRequirements(tokenAmount: number): TierRequirements | null {
  const tier = getLoanTier(tokenAmount);
  if (!tier) {
    return null;
  }
  return LOAN_TIERS[tier];
}

/**
 * Check if a user meets the tier requirements for a loan amount
 * @param tokenAmount - The loan amount in tokens
 * @param userStars - User's available stars
 * @param currentVouchers - Number of vouchers already received for the loan
 * @returns Object with validation result and missing requirements
 */
export function checkTierRequirements(
  tokenAmount: number,
  userStars: number,
  currentVouchers: number = 0
): {
  isValid: boolean;
  tier: LoanTier | null;
  requirements: TierRequirements | null;
  missingStars: number;
  missingVouchers: number;
} {
  const tier = getLoanTier(tokenAmount);
  if (!tier) {
    return {
      isValid: false,
      tier: null,
      requirements: null,
      missingStars: 0,
      missingVouchers: 0,
    };
  }

  const requirements = LOAN_TIERS[tier];
  const missingStars = Math.max(0, requirements.minStars - userStars);
  const missingVouchers = Math.max(0, requirements.minVouchers - currentVouchers);

  return {
    isValid: missingStars === 0 && missingVouchers === 0,
    tier,
    requirements,
    missingStars,
    missingVouchers,
  };
}

/**
 * Get a human-readable description of tier requirements
 * @param tier - The tier number
 * @returns Formatted string describing the tier
 */
export function getTierDescription(tier: LoanTier): string {
  const req = LOAN_TIERS[tier];
  return `Tier ${tier}: ${req.minTokens}-${req.maxTokens} tokens, ${req.minStars} stars, ${req.minVouchers} vouchers`;
}

/**
 * Get all tiers as an array (useful for UI display)
 */
export function getAllTiers(): TierRequirements[] {
  return [LOAN_TIERS[1], LOAN_TIERS[2], LOAN_TIERS[3]];
}
