import { useEffect, useState } from 'react';
import { AddressConverter } from '@/lib/address-converter';
import type { ContractCallResult, GenericContractCallResult } from '@dedot/contracts';
import type { GenericSubstrateApi } from 'dedot/types';

type LegacyOwnerQueryResult = {
  result?: { isErr?: boolean };
  output?: unknown;
};

type DedotOwnerQueryResult = GenericContractCallResult<unknown, ContractCallResult<GenericSubstrateApi>>;

type OwnerQueryResult = LegacyOwnerQueryResult | DedotOwnerQueryResult;

function isDedotOwnerResult(value: unknown): value is DedotOwnerQueryResult {
  if (!value || typeof value !== 'object') return false;
  return 'data' in value && 'raw' in value;
}

function normalizeOwnerResponse(response: OwnerQueryResult) {
  if (isDedotOwnerResult(response)) {
    const dedotResult = (response.raw as ContractCallResult<GenericSubstrateApi> | undefined)?.result;
    const hasError = Boolean(dedotResult && typeof dedotResult === 'object' && 'isErr' in dedotResult && dedotResult.isErr);
    return { ownerPayload: response.data, hasError } as const;
  }

  return {
    ownerPayload: response.output,
    hasError: Boolean(response.result?.isErr),
  } as const;
}

function extractOwnerString(output: unknown): string | null {
  if (!output) return null;

  if (typeof output === 'string') {
    return output;
  }

  if (typeof (output as any).value === 'string') {
    return (output as any).value;
  }

  if (typeof (output as any)?.Ok === 'string') {
    return (output as any).Ok;
  }

  if (typeof (output as any)?.ok === 'string') {
    return (output as any).ok;
  }

  if (typeof (output as any)?.toHuman === 'function') {
    const human = (output as any).toHuman();
    if (typeof human === 'string') {
      return human;
    }
    if (human && typeof human === 'object') {
      if (typeof (human as any).Ok === 'string') {
        return (human as any).Ok;
      }
      if (typeof (human as any).ok === 'string') {
        return (human as any).ok;
      }
    }
  }

  if (typeof (output as any)?.toString === 'function') {
    const value = (output as any).toString();
    if (value && value !== '[object Object]') {
      return value;
    }
  }

  if (typeof (output as any)?.toJSON === 'function') {
    const jsonValue = (output as any).toJSON();
    if (typeof jsonValue === 'string') {
      return jsonValue;
    }
    if (jsonValue && typeof jsonValue === 'object') {
      if (typeof (jsonValue as any).Ok === 'string') {
        return (jsonValue as any).Ok;
      }
      if (typeof (jsonValue as any).ok === 'string') {
        return (jsonValue as any).ok;
      }
    }
  }

  return null;
}

type ContractLike = {
  query: {
    getOwner: (...args: any[]) => Promise<OwnerQueryResult>;
  };
  api?: {
    registry?: {
      createType: (type: string, value: Record<string, bigint>) => unknown;
    };
  };
};

type AccountLike = {
  address?: string;
} | null;

export function useContractOwner(contract?: ContractLike | null, userAccount?: AccountLike) {
  const [ownerH160, setOwnerH160] = useState<string | null>(null);
  const [ownerSS58, setOwnerSS58] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const updateState = (updater: () => void) => {
      if (!cancelled) {
        updater();
      }
    };

    async function fetchOwner() {
      if (!contract || !userAccount?.address) {
        updateState(() => {
          setOwnerH160(null);
          setOwnerSS58(null);
          setIsOwner(false);
          setLoading(false);
          setError(null);
        });
        return;
      }

      try {
        updateState(() => {
          setLoading(true);
          setError(null);
        });

        const gasLimit = contract.api?.registry?.createType?.('WeightV2', {
          refTime: 1_000_000_000n,
          proofSize: 131_072n,
        });

        const queryOptions = gasLimit ? { gasLimit } : undefined;
        const expectsCaller = contract.query.getOwner.length > 1;
        const queryResponse = (expectsCaller
          ? await contract.query.getOwner(userAccount.address, queryOptions)
          : await contract.query.getOwner(queryOptions)) as OwnerQueryResult;

        const { ownerPayload, hasError } = normalizeOwnerResponse(queryResponse);

        if (hasError) {
          throw new Error('Error querying contract owner');
        }

        const rawOwner = extractOwnerString(ownerPayload);

        if (!rawOwner) {
          console.warn('Owner query returned empty response', ownerPayload);
          updateState(() => {
            setOwnerH160(null);
            setOwnerSS58(null);
            setIsOwner(false);
            setError('Owner query returned empty response');
          });
          return;
        }

        const ownerHex = rawOwner.startsWith('0x') ? rawOwner : `0x${rawOwner}`;
        const ownerSs58 = AddressConverter.h160ToSS58(ownerHex);
        const userIsOwner = AddressConverter.isEqual(userAccount.address, ownerHex);

        console.log('Contract owner resolved', {
          ownerHex: ownerHex.toLowerCase(),
          ownerSs58,
          userAddress: userAccount.address,
          userIsOwner,
        });

        updateState(() => {
          setOwnerH160(ownerHex.toLowerCase());
          setOwnerSS58(ownerSs58);
          setIsOwner(userIsOwner);
        });
      } catch (err: any) {
        console.error('Error fetching owner:', err);
        updateState(() => {
          setError(err?.message ?? 'Unknown error');
        });
      } finally {
        updateState(() => setLoading(false));
      }
    }

    fetchOwner();

    return () => {
      cancelled = true;
    };
  }, [contract, userAccount?.address]);

  return { ownerH160, ownerSS58, isOwner, loading, error } as const;
}
