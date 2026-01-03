import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys
export const profileKeys = {
  all: ['profile'] as const,
  detail: (address: string) => [...profileKeys.all, address] as const,
  stats: (address: string) => [...profileKeys.detail(address), 'stats'] as const,
};

/**
 * Hook to fetch user profile by wallet address
 */
export function useProfile(walletAddress: string | undefined) {
  return useQuery({
    queryKey: walletAddress ? profileKeys.detail(walletAddress) : ['profile', 'null'],
    queryFn: () => {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }
      throw new Error('getProfile not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch user profile statistics
 */
export function useProfileStats(walletAddress: string | undefined) {
  return useQuery({
    queryKey: walletAddress ? profileKeys.stats(walletAddress) : ['profile', 'stats', 'null'],
    queryFn: () => {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }
      throw new Error('getProfileStats not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to update user capital
 */
export function useUpdateCapital() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ walletAddress, capital }: { walletAddress: string; capital: bigint }) => {
      throw new Error('updateCapital not implemented - mock removed');
    },
    onSuccess: (_, variables) => {
      // Invalidate profile queries for this address
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.walletAddress) });
    },
  });
}

/**
 * Hook to update user reputation
 */
export function useUpdateReputation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ walletAddress, reputation }: { walletAddress: string; reputation: number }) => {
      throw new Error('updateReputation not implemented - mock removed');
    },
    onSuccess: (_, variables) => {
      // Invalidate profile queries for this address
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.walletAddress) });
    },
  });
}

/**
 * Hook to update income reference
 */
export function useUpdateIncomeReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletAddress,
      incomeReference,
    }: {
      walletAddress: string;
      incomeReference: string | null;
    }) => {
      throw new Error('updateIncomeReference not implemented - mock removed');
    },
    onSuccess: (_, variables) => {
      // Invalidate profile queries for this address
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.walletAddress) });
    },
  });
}

