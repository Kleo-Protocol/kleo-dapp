/**
 * Shared formatting utilities for the application
 */

/**
 * Formats a bigint balance to a human-readable token amount
 * @param balance - Balance in smallest unit (e.g., wei, planck)
 * @param decimals - Number of decimals (default: 18)
 * @param useThousandsFormat - Whether to use K format for thousands (default: true)
 * @returns Formatted string with locale-specific number formatting
 */
export function formatBalance(balance: bigint, decimals: number = 18, useThousandsFormat: boolean = true): string {
  const tokens = Number(balance) / 10 ** decimals;
  if (useThousandsFormat && tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  // Don't use grouping (commas) to keep the number clean
  return tokens.toLocaleString('en-US', { maximumFractionDigits: 2, useGrouping: false });
}

/**
 * Formats an interest rate to percentage
 * The rate is stored with 10 decimal places precision (multiplied by 10^10)
 * @param rate - Interest rate stored as bigint with 10 decimal precision (e.g., 1000000112 = 10.00000112%)
 * @returns Formatted percentage string with all decimals preserved
 */
export function formatInterestRate(rate: bigint): string {
  // Rate is stored with 10 decimal places precision (multiplied by 10^10)
  // Divide by 10^10 to get the decimal, then multiply by 100 to convert to percentage display
  // Example: 1000000112 / 10000000000 * 100 = 10.00000112%
  const percentage = (Number(rate) / 10000000000) * 100;
  // Format with all decimals preserved, no grouping
  return `${percentage.toLocaleString('en-US', { maximumFractionDigits: 20, useGrouping: false, minimumFractionDigits: 2 })}%`;
}

/**
 * Formats a timestamp to a readable date string
 * @param timestamp - Unix timestamp (seconds) or Date timestamp (milliseconds)
 * @returns Formatted date string
 */
export function formatDate(timestamp: bigint | number): string {
  const date = new Date(typeof timestamp === 'bigint' ? Number(timestamp) * 1000 : timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an address to a shortened version
 * @param address - Full address string
 * @param startLength - Number of characters at start (default: 8)
 * @param endLength - Number of characters at end (default: 6)
 * @returns Shortened address string
 */
export function formatAddress(address: string, startLength: number = 8, endLength: number = 6): string {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

