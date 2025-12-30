/**
 * Shared formatting utilities for the application
 */

/**
 * Formats a bigint balance to a human-readable token amount
 * @param balance - Balance in smallest unit (e.g., wei, planck)
 * @param decimals - Number of decimals (default: 18)
 * @returns Formatted string with locale-specific number formatting
 */
export function formatBalance(balance: bigint, decimals: number = 18): string {
  const tokens = Number(balance) / 10 ** decimals;
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Formats an interest rate from basis points to percentage
 * @param rate - Interest rate in basis points (e.g., 500 = 5%)
 * @returns Formatted percentage string
 */
export function formatInterestRate(rate: bigint): string {
  const percentage = Number(rate) / 100;
  return `${percentage.toFixed(2)}%`;
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

