/**
 * Mock service for lending pools data
 * Simulates backend API responses matching contract shapes
 */

export interface Pool {
  poolId: string; // Hash
  name: string;
  description: string;
  totalLiquidity: bigint; // Balance
  availableLiquidity: bigint; // Balance
  totalLoans: number;
  activeLoans: number;
  baseInterestRate: bigint; // u64 - in basis points (e.g., 500 = 5%)
  minLenders: number; // u32
  overfundingFactor: bigint; // u64 - in basis points
  createdAt: number; // Timestamp
  status: 'active' | 'paused' | 'closed';
}

export interface PoolStats {
  poolId: string;
  totalLiquidity: bigint;
  availableLiquidity: bigint;
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultRate: number; // Percentage 0-100
  averageLoanAmount: bigint;
  totalLent: bigint;
  totalRepaid: bigint;
}

// Simulate network latency
const delay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Mock pools data
const mockPools: Map<string, Pool> = new Map([
  [
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    {
      poolId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      name: 'Main Lending Pool',
      description: 'Primary lending pool for general purpose loans',
      totalLiquidity: 1000000000000000000000n, // 1000 tokens
      availableLiquidity: 750000000000000000000n, // 750 tokens
      totalLoans: 45,
      activeLoans: 12,
      baseInterestRate: 500n, // 5%
      minLenders: 3,
      overfundingFactor: 12000n, // 120%
      createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
      status: 'active',
    },
  ],
  [
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    {
      poolId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      name: 'High Risk Pool',
      description: 'Pool for borrowers with lower credit scores',
      totalLiquidity: 500000000000000000000n, // 500 tokens
      availableLiquidity: 300000000000000000000n, // 300 tokens
      totalLoans: 28,
      activeLoans: 8,
      baseInterestRate: 1200n, // 12%
      minLenders: 2,
      overfundingFactor: 15000n, // 150%
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000, // 180 days ago
      status: 'active',
    },
  ],
  [
    '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    {
      poolId: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      name: 'Premium Pool',
      description: 'Exclusive pool for verified borrowers with excellent credit',
      totalLiquidity: 2000000000000000000000n, // 2000 tokens
      availableLiquidity: 1800000000000000000000n, // 1800 tokens
      totalLoans: 15,
      activeLoans: 3,
      baseInterestRate: 300n, // 3%
      minLenders: 5,
      overfundingFactor: 11000n, // 110%
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      status: 'active',
    },
  ],
]);

/**
 * Get all pools
 */
export async function getAllPools(): Promise<Pool[]> {
  await delay(400);

  return Array.from(mockPools.values()).map((pool) => ({ ...pool }));
}

/**
 * Get pool by ID
 */
export async function getPool(poolId: string): Promise<Pool | null> {
  await delay(250);

  const pool = mockPools.get(poolId);
  return pool ? { ...pool } : null;
}

/**
 * Get pool statistics
 */
export async function getPoolStats(poolId: string): Promise<PoolStats | null> {
  await delay(300);

  const pool = mockPools.get(poolId);
  if (!pool) {
    return null;
  }

  const defaultedLoans = Math.floor(pool.totalLoans * 0.05); // 5% default rate
  const completedLoans = pool.totalLoans - pool.activeLoans - defaultedLoans;
  const totalLent = pool.totalLiquidity - pool.availableLiquidity;
  const totalRepaid = totalLent * BigInt(85) / BigInt(100); // 85% repayment rate

  return {
    poolId: pool.poolId,
    totalLiquidity: pool.totalLiquidity,
    availableLiquidity: pool.availableLiquidity,
    totalLoans: pool.totalLoans,
    activeLoans: pool.activeLoans,
    completedLoans: completedLoans,
    defaultRate: 5.0,
    averageLoanAmount: totalLent / BigInt(pool.totalLoans || 1),
    totalLent,
    totalRepaid,
  };
}

/**
 * Get available pools for lending
 */
export async function getAvailablePools(): Promise<Pool[]> {
  await delay(350);

  return Array.from(mockPools.values())
    .filter((pool) => pool.status === 'active' && pool.availableLiquidity > 0n)
    .map((pool) => ({ ...pool }));
}

/**
 * Update pool liquidity
 */
export async function updatePoolLiquidity(
  poolId: string,
  liquidityDelta: bigint
): Promise<boolean> {
  await delay(400);

  const pool = mockPools.get(poolId);
  if (!pool) {
    return false;
  }

  pool.totalLiquidity += liquidityDelta;
  pool.availableLiquidity += liquidityDelta;

  // Ensure available doesn't exceed total
  if (pool.availableLiquidity > pool.totalLiquidity) {
    pool.availableLiquidity = pool.totalLiquidity;
  }

  return true;
}

