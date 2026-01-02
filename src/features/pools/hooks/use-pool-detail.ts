'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { usePoolDetail, usePoolStats } from '@/features/pools/hooks/use-pools';
import { useUiStore } from '@/store/ui.store';
import { useUserStore } from '@/store/user.store';
import { formatBalance, formatInterestRate } from '@/shared/utils/format';
import type { Pool } from '@/services/mock/pools.mock';
import { TIER_MULTIPLIERS, REPUTATION_CONSTANTS, DEFAULTS } from '@/lib/constants';

export function usePoolDetailLogic() {
  const { poolId } = useParams<{ poolId: string }>();
  const { data: pool, isLoading } = usePoolDetail(poolId);
  const { data: poolStats } = usePoolStats(poolId);
  const { activePoolTab, setActivePoolTab } = useUiStore();
  const { reputation, tier } = useUserStore();
  const [depositAmount, setDepositAmount] = useState(0);

  // Mock: Check if user is pool creator (in real app, this would come from backend)
  const isPoolCreator = true; // Mock: always true for demo

  // Calculate max borrow based on user's reputation and tier
  const calculateMaxBorrow = useCallback((pool: Pool) => {
    const baseMultiplier = 
      tier === 'verde' ? TIER_MULTIPLIERS.VERDE : 
      tier === 'amarillo' ? TIER_MULTIPLIERS.AMARILLO : 
      TIER_MULTIPLIERS.DEFAULT;
    const reputationMultiplier = Math.floor(reputation / DEFAULTS.REPUTATION_DIVISOR);
    const maxBorrow = baseMultiplier * reputationMultiplier * REPUTATION_CONSTANTS.BASE_MULTIPLIER;
    const poolAvailable = Number(pool.availableLiquidity) / 10 ** DEFAULTS.DECIMAL_PLACES;
    return Math.min(maxBorrow, poolAvailable);
  }, [tier, reputation]);

  const getStatusBadge = useCallback((pool: Pool | null | undefined) => {
    if (!pool) return null;
    switch (pool.status) {
      case 'active':
        return { variant: 'verde' as const, label: 'Active' };
      case 'paused':
        return { variant: 'amarillo' as const, label: 'Paused' };
      case 'closed':
        return { variant: 'rojo' as const, label: 'Closed' };
      default:
        return null;
    }
  }, []);

  const utilizationRate = useMemo(() => {
    if (!pool) return 0;
    return pool.totalLiquidity > 0n
      ? Number(((pool.totalLiquidity - pool.availableLiquidity) * BigInt(100)) / pool.totalLiquidity)
      : 0;
  }, [pool]);

  const maxBorrow = useMemo(() => {
    if (!pool) return 0;
    return calculateMaxBorrow(pool);
  }, [pool, calculateMaxBorrow]);

  return {
    pool,
    poolStats,
    isLoading,
    activePoolTab,
    setActivePoolTab,
    depositAmount,
    setDepositAmount,
    isPoolCreator,
    maxBorrow,
    utilizationRate,
    getStatusBadge,
    formatBalance,
    formatInterestRate,
  };
}

