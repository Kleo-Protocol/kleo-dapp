import type { H160 } from 'dedot/codecs';

export type HexAddress = `0x${string}`;

const HEX_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Normalizes a hex address to a lowercase H160-compatible string.
 */
export function normalizeHexAddress(address?: string | null): HexAddress | undefined {
  if (!address) return undefined;
  const trimmed = address.trim();
  if (!trimmed) return undefined;

  const prefixed = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
  const lowered = prefixed.toLowerCase() as HexAddress;

  if (!HEX_REGEX.test(lowered)) {
    return undefined;
  }

  return lowered;
}

/**
 * Casts a normalized address to the H160 codec expected by ink! contracts.
 */
export function addressToH160(address?: string | null): H160 | undefined {
  const normalized = normalizeHexAddress(address);
  if (!normalized) return undefined;

  return normalized as H160;
}

export function formatScore(score?: number) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return '—';
  }

  return score.toLocaleString();
}
