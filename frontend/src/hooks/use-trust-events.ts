'use client';

import { useCallback, useState } from 'react';
import { useContract, useWatchContractEvent } from 'typink';
import { ContractId } from '@/contracts/deployments';
import { TrustOracleContractApi } from '@/contracts/types/trust-oracle';

export interface TrustEventItem {
  id: string;
  borrower: string;
  kind: string;
  amount?: bigint;
  timestamp?: number;
  newScore: number;
  blockNumber?: number;
}

export function useTrustEvents(maxEvents = 24) {
  const { contract } = useContract<TrustOracleContractApi>(ContractId.TRUST_ORACLE);
  const [events, setEvents] = useState<TrustEventItem[]>([]);

  const handleEvents = useCallback(
    (incoming: any[]) => {
      if (!incoming?.length) return;

      setEvents((prev) => {
        const mapped = incoming.map((event) => {
          const {
            blockNumber,
            data: { borrower, kind, amount, timestamp, newScore },
          } = event;

          const ts = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp ?? 0);

          return {
            id: `${blockNumber ?? Date.now()}-${Math.random()}`,
            borrower,
            kind,
            amount,
            timestamp: Number.isFinite(ts) ? ts : undefined,
            newScore,
            blockNumber,
          } satisfies TrustEventItem;
        });

        const next = [...mapped, ...prev];
        return next.slice(0, maxEvents);
      });
    },
    [maxEvents],
  );

  useWatchContractEvent(contract, 'TrustEventRecorded', handleEvents);

  return { contract, events };
}
