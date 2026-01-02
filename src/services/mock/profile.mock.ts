/**
 * Mock service for user profile data
 * Simulates backend API responses matching contract shapes
 */

export interface Profile {
  walletAddress: string;
  capital: bigint; // Balance in smallest unit (e.g., wei, planck)
  reputation: number; // Credit score/reputation points
  tier: 'rojo' | 'amarillo' | 'verde';
  incomeReference: string | null;
  registeredAt: number; // Timestamp
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalLent: bigint;
  totalBorrowed: bigint;
}

export interface ProfileStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalLent: bigint;
  totalBorrowed: bigint;
  averageLoanAmount: bigint;
  onTimePaymentRate: number; // Percentage 0-100
}

// Simulate network latency
const delay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Mock profile data
const mockProfiles: Map<string, Profile> = new Map([
  [
    '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    {
      walletAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      capital: 1500000000000000000n, // 1.5 tokens
      reputation: 850,
      tier: 'verde',
      incomeReference: 'REF-2024-001',
      registeredAt: Date.now() - 180 * 24 * 60 * 60 * 1000, // 180 days ago
      totalLoans: 12,
      activeLoans: 2,
      completedLoans: 9,
      defaultedLoans: 1,
      totalLent: 50000000000000000000n, // 50 tokens
      totalBorrowed: 30000000000000000000n, // 30 tokens
    },
  ],
  [
    '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    {
      walletAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      capital: 500000000000000000n, // 0.5 tokens
      reputation: 650,
      tier: 'amarillo',
      incomeReference: 'REF-2024-002',
      registeredAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      totalLoans: 5,
      activeLoans: 1,
      completedLoans: 3,
      defaultedLoans: 1,
      totalLent: 10000000000000000000n, // 10 tokens
      totalBorrowed: 15000000000000000000n, // 15 tokens
    },
  ],
  [
    '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    {
      walletAddress: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
      capital: 200000000000000000n, // 0.2 tokens
      reputation: 350,
      tier: 'rojo',
      incomeReference: null,
      registeredAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      totalLoans: 2,
      activeLoans: 1,
      completedLoans: 0,
      defaultedLoans: 1,
      totalLent: 0n,
      totalBorrowed: 5000000000000000000n, // 5 tokens
    },
  ],
]);

/**
 * Get user profile by wallet address
 */
export async function getProfile(walletAddress: string): Promise<Profile | null> {
  await delay(250);

  const profile = mockProfiles.get(walletAddress);
  if (!profile) {
    // Return default profile for new users
    return {
      walletAddress,
      capital: 0n,
      reputation: 0,
      tier: 'rojo',
      incomeReference: null,
      registeredAt: Date.now(),
      totalLoans: 0,
      activeLoans: 0,
      completedLoans: 0,
      defaultedLoans: 0,
      totalLent: 0n,
      totalBorrowed: 0n,
    };
  }

  return { ...profile };
}

/**
 * Get profile statistics
 */
export async function getProfileStats(walletAddress: string): Promise<ProfileStats> {
  await delay(200);

  const profile = mockProfiles.get(walletAddress);
  if (!profile) {
    return {
      totalLoans: 0,
      activeLoans: 0,
      completedLoans: 0,
      defaultedLoans: 0,
      totalLent: 0n,
      totalBorrowed: 0n,
      averageLoanAmount: 0n,
      onTimePaymentRate: 0,
    };
  }

  const completed = profile.completedLoans;
  const total = profile.totalLoans;
  const onTimeRate = total > 0 && completed > 0 ? ((completed - profile.defaultedLoans) / completed) * 100 : 0;

  return {
    totalLoans: profile.totalLoans,
    activeLoans: profile.activeLoans,
    completedLoans: profile.completedLoans,
    defaultedLoans: profile.defaultedLoans,
    totalLent: profile.totalLent,
    totalBorrowed: profile.totalBorrowed,
    averageLoanAmount:
      profile.totalLoans > 0 ? profile.totalBorrowed / BigInt(profile.totalLoans) : 0n,
    onTimePaymentRate: Math.max(0, Math.min(100, onTimeRate)),
  };
}

/**
 * Update profile capital
 */
export async function updateCapital(walletAddress: string, capital: bigint): Promise<boolean> {
  await delay(300);

  const profile = mockProfiles.get(walletAddress);
  if (profile) {
    profile.capital = capital;
    return true;
  }

  // Create new profile if doesn't exist
  mockProfiles.set(walletAddress, {
    walletAddress,
    capital,
    reputation: 0,
    tier: 'rojo',
    incomeReference: null,
    registeredAt: Date.now(),
    totalLoans: 0,
    activeLoans: 0,
    completedLoans: 0,
    defaultedLoans: 0,
    totalLent: 0n,
    totalBorrowed: 0n,
  });

  return true;
}

/**
 * Update profile reputation
 */
export async function updateReputation(
  walletAddress: string,
  reputation: number
): Promise<boolean> {
  await delay(300);

  const profile = mockProfiles.get(walletAddress);
  if (!profile) {
    return false;
  }

  profile.reputation = reputation;

  // Update tier based on reputation
  if (reputation >= 700) {
    profile.tier = 'verde';
  } else if (reputation >= 400) {
    profile.tier = 'amarillo';
  } else {
    profile.tier = 'rojo';
  }

  return true;
}

/**
 * Update income reference
 */
export async function updateIncomeReference(
  walletAddress: string,
  incomeReference: string | null
): Promise<boolean> {
  await delay(300);

  const profile = mockProfiles.get(walletAddress);
  if (!profile) {
    return false;
  }

  profile.incomeReference = incomeReference;
  return true;
}

