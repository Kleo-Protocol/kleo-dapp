'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { usePools, usePoolState, usePoolStats } from '@/features/pools/hooks/use-pools';
import { useKleoClient } from '@/providers/kleo-client-provider';
import { useUiStore } from '@/store/ui.store';
import { useUserStore } from '@/store/user.store';
import { formatBalance, formatInterestRate } from '@/shared/utils/format';
import type { PoolState } from '@kleo-protocol/kleo-sdk';

export function usePoolDetailLogic() {
  const { poolId } = useParams<{ poolId: string }>();
  const { isConnected, isConnecting, error: clientError } = useKleoClient();
  const { data: pools = [], isLoading: isPoolsLoading } = usePools();
  const { data: poolState, isLoading: isPoolStateLoading, error: poolStateError } = usePoolState(poolId);
  const { data: poolStats } = usePoolStats(poolId);
  const { activePoolTab, setActivePoolTab } = useUiStore();
  const { reputation, tier } = useUserStore();
  const [depositAmount, setDepositAmount] = useState(0);

  // Debug logging
  console.log('usePoolDetailLogic:', { 
    poolId, 
    isConnected, 
    isConnecting, 
    poolsCount: pools.length,
    poolState, 
    poolStateError: poolStateError?.message,
    clientError: clientError?.message 
  });

  // Get the pool from the list
  const pool = useMemo(() => {
    return pools.find((p) => p.poolId === poolId) ?? null;
  }, [pools, poolId]);

  // Loading state considers: connecting to SDK, loading pools list, or loading pool state
  const isLoading = isConnecting || !isConnected || isPoolsLoading || isPoolStateLoading;

  // Error state
  const error = clientError || poolStateError;

  // Mock: Check if user is pool creator (in real app, this would come from backend)
  const isPoolCreator = true; // Mock: always true for demo

  // Calculate max borrow based on user's reputation and tier and pool exposure cap
  const calculateMaxBorrow = (poolState: PoolState | null | undefined) => {
    if (!poolState) return 0;
    const baseMultiplier = tier === 'verde' ? 10 : tier === 'amarillo' ? 5 : 2;
    const reputationMultiplier = Math.floor(reputation / 100);
    const maxBorrow = baseMultiplier * reputationMultiplier * 1000;
    const exposureCap = Number(poolState.exposureCap) / 1e18;
    return Math.min(maxBorrow, exposureCap);
  };

  const getStatusBadge = () => {
    // Pool state doesn't have status, assume active if we have data
    if (!poolState) return null;
    return { variant: 'verde' as const, label: 'Active' };
  };

  // Format pool state values for display
  const formatPoolStateValue = (value: string, decimals: number = 18): string => {
    const num = Number(value) / Math.pow(10, decimals);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatBasisPoints = (value: string): string => {
    const num = Number(value) / 100;
    return `${num.toFixed(2)}%`;
  };

  const maxBorrow = useMemo(() => {
    if (!poolState) return 0;
    return calculateMaxBorrow(poolState);
  }, [poolState, tier, reputation]);

  return {
    pool,
    poolState,
    poolStats,
    isLoading,
    error,
    activePoolTab,
    setActivePoolTab,
    depositAmount,
    setDepositAmount,
    isPoolCreator,
    maxBorrow,
    getStatusBadge,
    formatBalance,
    formatInterestRate,
    formatPoolStateValue,
    formatBasisPoints,
  };
}

