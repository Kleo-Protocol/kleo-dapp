import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const shortenAddress = (address?: string): string => {
  if (!address) {
    return '';
  }
  const length = address.length;

  return `${address.substring(0, 7)}...${address.substring(length - 7, length)}`;
};
