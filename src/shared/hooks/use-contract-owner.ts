import { useEffect, useState } from 'react';
import { AddressConverter } from '@/lib/address-converter';
import type { ContractCallResult, GenericContractCallResult } from '@dedot/contracts';
import type { GenericSubstrateApi } from 'dedot/types';
import { logger } from '@/lib/logger';

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

interface OutputWithValue {
  value?: string;
}

interface OutputWithOk {
  Ok?: string;
  ok?: string;
}

interface OutputWithToHuman {
  toHuman?: () => string | OutputWithOk | null;
}

interface OutputWithToString {
  toString?: () => string;
}

interface OutputWithToJSON {
  toJSON?: () => string | OutputWithOk | null;
}

type ExtractableOutput = 
  | string 
  | OutputWithValue 
  | OutputWithOk 
  | OutputWithToHuman 
  | OutputWithToString 
  | OutputWithToJSON;

function extractOwnerString(output: unknown): string | null {
  if (!output) return null;

  if (typeof output === 'string') {
    return output;
  }

  const typedOutput = output as ExtractableOutput;

  if (typeof typedOutput === 'object' && typedOutput !== null) {
    // Check for .value property
    if ('value' in typedOutput && typeof typedOutput.value === 'string') {
      return typedOutput.value;
    }

    // Check for .Ok or .ok properties
    if ('Ok' in typedOutput && typeof typedOutput.Ok === 'string') {
      return typedOutput.Ok;
    }
    if ('ok' in typedOutput && typeof typedOutput.ok === 'string') {
      return typedOutput.ok;
    }

    // Check for .toHuman() method
    if ('toHuman' in typedOutput && typeof typedOutput.toHuman === 'function') {
      const human = typedOutput.toHuman();
      if (typeof human === 'string') {
        return human;
      }
      if (human && typeof human === 'object') {
        if ('Ok' in human && typeof (human as OutputWithOk).Ok === 'string') {
          return (human as OutputWithOk).Ok;
        }
        if ('ok' in human && typeof (human as OutputWithOk).ok === 'string') {
          return (human as OutputWithOk).ok;
        }
      }
    }

    // Check for .toString() method
    if ('toString' in typedOutput && typeof typedOutput.toString === 'function') {
      const value = typedOutput.toString();
      if (value && value !== '[object Object]') {
        return value;
      }
    }

    // Check for .toJSON() method
    if ('toJSON' in typedOutput && typeof typedOutput.toJSON === 'function') {
      const jsonValue = typedOutput.toJSON();
      if (typeof jsonValue === 'string') {
        return jsonValue;
      }
      if (jsonValue && typeof jsonValue === 'object') {
        if ('Ok' in jsonValue && typeof (jsonValue as OutputWithOk).Ok === 'string') {
          return (jsonValue as OutputWithOk).Ok;
        }
        if ('ok' in jsonValue && typeof (jsonValue as OutputWithOk).ok === 'string') {
          return (jsonValue as OutputWithOk).ok;
        }
      }
    }
  }

  return null;
}

type ContractLike = {
  query: {
    getOwner: (addressOrOptions?: string | { gasLimit?: unknown }, options?: { gasLimit?: unknown }) => Promise<OwnerQueryResult>;
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
          logger.warn('Owner query returned empty response', { ownerPayload });
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

        logger.debug('Contract owner resolved', {
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
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Error fetching owner', { error: error.message }, error);
        updateState(() => {
          setError(error.message ?? 'Unknown error');
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
