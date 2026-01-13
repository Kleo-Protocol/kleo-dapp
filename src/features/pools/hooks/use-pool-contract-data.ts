import { useMemo } from 'react';
import { useTotalLiquidity, useTotalBorrowed } from './use-pool-info-queries';
import { useActiveLoans } from './use-loan-queries';
import { useCurrentRate } from './use-lending-pool-data';

/**
 * Hook that combines all contract data needed for pool display
 * Fetches totalLiquidity, totalBorrowed, activeLoans, and currentRate
 * Calculates availableLiquidity and utilization
 * 
 * @returns Pool contract data with calculated values
 */
export function usePoolContractData() {
  const { data: totalLiquidity, isLoading: isLoadingLiquidity } = useTotalLiquidity();
  const { data: totalBorrowed, isLoading: isLoadingBorrowed } = useTotalBorrowed();
  const { data: activeLoans, isLoading: isLoadingActiveLoans } = useActiveLoans();
  const { data: currentRate, isLoading: isLoadingRate } = useCurrentRate();

  const contractData = useMemo(() => {
    // Default values
    const defaultTotalLiquidity = totalLiquidity ?? 0n;
    const defaultTotalBorrowed = totalBorrowed ?? 0n;
    const defaultActiveLoans = activeLoans ?? [];
    const defaultCurrentRate = currentRate ?? 0;

    // Convert totalBorrowed from 10 decimals (storage format) to 18 decimals (chain format)
    // Multiply by 10^8 to convert from 10 to 18 decimals
    const totalBorrowed18 = defaultTotalBorrowed * BigInt(10 ** 8);

    // Calculate available liquidity: totalLiquidity - totalBorrowed (both in 18 decimals)
    const availableLiquidity = defaultTotalLiquidity > totalBorrowed18
      ? defaultTotalLiquidity - totalBorrowed18
      : 0n;

    // Calculate utilization percentage
    // Convert both to numbers for calculation, maintaining precision
    let utilization = 0;
    if (defaultTotalLiquidity > 0n) {
      // Scale totalBorrowed to 18 decimals for accurate calculation
      const borrowedScaled = Number(defaultTotalBorrowed) * (10 ** 8);
      const liquidityScaled = Number(defaultTotalLiquidity);
      utilization = (borrowedScaled / liquidityScaled) * 100;
      utilization = Math.min(100, Math.max(0, utilization)); // Clamp between 0 and 100
    }

    // Get active loans count
    const activeLoansCount = defaultActiveLoans.length;

    // Convert current rate from percentage with high precision
    // currentRate is a percentage as decimal (e.g., 0.1000000112 = 10.00000112%)
    // To preserve all decimal precision, multiply by 10^10 to store 10 decimal places
    // Then when formatting, divide by 10^10 and multiply by 100 to get percentage
    // Example: 0.1000000112 * 10000000000 = 1000000112, store as 1000000112n
    // Format: 1000000112 / 10000000000 * 100 = 10.00000112%
    const currentRateBasisPoints = BigInt(Math.round(defaultCurrentRate * 10000));

    return {
      totalLiquidity: defaultTotalLiquidity,
      totalBorrowed: defaultTotalBorrowed,
      availableLiquidity,
      activeLoansCount,
      currentRate: defaultCurrentRate,
      currentRateBasisPoints,
      utilization,
      isLoading: isLoadingLiquidity || isLoadingBorrowed || isLoadingActiveLoans || isLoadingRate,
    };
  }, [totalLiquidity, totalBorrowed, activeLoans, currentRate, isLoadingLiquidity, isLoadingBorrowed, isLoadingActiveLoans, isLoadingRate]);

  return contractData;
}
