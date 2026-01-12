import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex, u8aToHex } from '@polkadot/util';
import { logger } from '@/lib/logger';

function sanitize(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function ensureHex(value: string) {
  const prefixed = value.startsWith('0x') ? value : `0x${value}`;
  if (!isHex(prefixed)) {
    throw new Error(`Invalid hex address: ${value}`);
  }
  return prefixed.toLowerCase();
}

export class AddressConverter {
  static readonly ASSET_HUB_PREFIX = 0;
  private static readonly H160_BYTES = 20;
  private static readonly PADDED_HEX_LENGTH = 64; // 32 bytes

  /** Convert H160 (ink!) to SS58 (SubWallet) padding with zeros to the right */
  static h160ToSS58(h160Address?: string | null) {
    const sanitized = sanitize(h160Address);
    if (!sanitized) {
      throw new Error('H160 address is required');
    }

    const cleanHex = ensureHex(sanitized).replace('0x', '');
    const paddedHex = cleanHex.padEnd(this.PADDED_HEX_LENGTH, '0');
    const accountBytes = hexToU8a(`0x${paddedHex}`);
    return encodeAddress(accountBytes, this.ASSET_HUB_PREFIX);
  }

  /** Convert SS58 wallet address to H160 (low 20 bytes) */
  static ss58ToH160(ss58Address?: string | null) {
    const sanitized = sanitize(ss58Address);
    if (!sanitized) {
      throw new Error('SS58 address is required');
    }

    const accountBytes = decodeAddress(sanitized);
    if (accountBytes.length < this.H160_BYTES) {
      throw new Error('SS58 payload shorter than 20 bytes');
    }

    const h160Bytes = accountBytes.slice(0, this.H160_BYTES);
    const hexValue = u8aToHex(h160Bytes);     
    return `0x${hexValue.slice(2)}`.toLowerCase();
  }

  static isEqual(ss58Address?: string | null, h160Address?: string | null) {
    try {
      if (!ss58Address || !h160Address) {
        return false;
      }
      const ss58AsH160 = this.ss58ToH160(ss58Address);
      return ss58AsH160.toLowerCase() === ensureHex(h160Address).toLowerCase();
    } catch (error) {
      logger.error('Error comparing addresses', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      return false;
    }
  }

  static format(address: string) {
    const sanitized = sanitize(address);
    if (!sanitized) {
      throw new Error('Address is required');
    }

    if (sanitized.startsWith('0x') || isHex(sanitized)) {
      const h160 = ensureHex(sanitized);
      const ss58 = this.h160ToSS58(h160);
      return {
        h160,
        ss58,
        short: `${ss58.slice(0, 6)}...${ss58.slice(-4)}`,
      } as const;
    }

    const ss58 = sanitized;
    const h160 = this.ss58ToH160(ss58);
    return {
      h160,
      ss58,
      short: `${ss58.slice(0, 6)}...${ss58.slice(-4)}`,
    } as const;
  }
}
