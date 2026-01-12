/**
 * Utility functions for working with loans from the contract
 */

import type { ContractLoan, Loan } from './types';
import type { LoanManagerLoan } from '@/contracts/types/loan-manager/types';
import type { AccountId32 } from 'dedot/codecs';

/**
 * Convert contract loan status to UI status
 */
export function normalizeLoanStatus(status: string): 'Active' | 'Repaid' | 'Defaulted' {
  if (status === 'Active' || status === 'Repaid' || status === 'Defaulted') {
    return status;
  }
  // Fallback for legacy statuses
  if (status === 'active') return 'Active';
  if (status === 'completed' || status === 'repaid') return 'Repaid';
  if (status === 'defaulted') return 'Defaulted';
  return 'Active'; // Default
}

/**
 * Decode purpose bytes to string
 */
export function decodePurpose(purpose: Uint8Array | string): string {
  if (typeof purpose === 'string') {
    // If it's already a string, try to decode if it's hex
    if (purpose.startsWith('0x')) {
      try {
        const bytes = new Uint8Array(
          purpose.slice(2).match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
        );
        return new TextDecoder().decode(bytes);
      } catch {
        return purpose;
      }
    }
    return purpose;
  }
  if (purpose instanceof Uint8Array) {
    return new TextDecoder().decode(purpose);
  }
  return '';
}

/**
 * Convert contract loan (LoanManagerLoan) to UI loan
 * Note: startTime is a block timestamp in seconds, term is in seconds
 */
export function contractLoanToLoan(contractLoan: LoanManagerLoan | ContractLoan, currentTime?: bigint): Loan {
  // Block timestamps are in seconds (Unix timestamp)
  // Current time in seconds
  const now = currentTime || BigInt(Math.floor(Date.now() / 1000));
  // Both startTime and term are in seconds
  const dueTime = contractLoan.startTime + contractLoan.term;
  // Convert seconds to days: divide by (60 * 60 * 24) = 86400
  const daysRemaining = Number((dueTime - now) / 86400n);
  const isOverdue = contractLoan.status === 'Active' && now > dueTime;

  // Use totalRepaymentAmount from contract if available (LoanManagerLoan has it)
  // Otherwise calculate it
  const totalRepayment = 'totalRepaymentAmount' in contractLoan && contractLoan.totalRepaymentAmount
    ? contractLoan.totalRepaymentAmount
    : (() => {
        // Calculate total repayment (principal + interest)
        // Interest calculation: amount * interestRate * term / (365 * 86400 * 10000)
        // Assuming interestRate is in basis points (per 10000)
        const interestAmount = (contractLoan.amount * contractLoan.interestRate * contractLoan.term) / (365n * 86400n * 10000n);
        return contractLoan.amount + interestAmount;
      })();

  // Decode purpose (only if it exists - LoanManagerLoan doesn't have purpose)
  const purposeText = 'purpose' in contractLoan && contractLoan.purpose 
    ? decodePurpose(contractLoan.purpose) 
    : undefined;

  // Handle vouchers - LoanManagerLoan doesn't have vouchers, ContractLoan does
  const vouchers = 'vouchers' in contractLoan && contractLoan.vouchers
    ? contractLoan.vouchers.map((v: string | AccountId32) => 
        typeof v === 'string' ? v : v.toString()
      )
    : [];

  return {
    ...contractLoan,
    loanId: contractLoan.loanId,
    borrower: typeof contractLoan.borrower === 'string' 
      ? contractLoan.borrower 
      : contractLoan.borrower.toString(),
    vouchers,
    purpose: 'purpose' in contractLoan ? contractLoan.purpose : new Uint8Array(),
    status: normalizeLoanStatus(contractLoan.status),
    dueTime,
    totalRepayment,
    daysRemaining: Math.max(0, daysRemaining),
    isOverdue,
    purposeText,
  };
}

/**
 * Convert UI loan to contract loan format
 */
export function loanToContractLoan(loan: Loan): ContractLoan {
  return {
    loanId: loan.loanId,
    borrower: loan.borrower,
    amount: loan.amount,
    interestRate: loan.interestRate,
    term: loan.term,
    purpose: loan.purpose,
    startTime: loan.startTime,
    status: loan.status,
    vouchers: loan.vouchers,
  };
}

/**
 * Calculate interest amount for a loan
 */
export function calculateInterest(amount: bigint, interestRate: bigint, term: bigint): bigint {
  // Interest = amount * interestRate * term / (365 * 86400 * 10000)
  // Assuming interestRate is in basis points (per 10000)
  return (amount * interestRate * term) / (365n * 86400n * 10000n);
}

/**
 * Calculate total repayment amount
 */
export function calculateTotalRepayment(amount: bigint, interestRate: bigint, term: bigint): bigint {
  return amount + calculateInterest(amount, interestRate, term);
}

/**
 * Check if loan is overdue
 * Note: startTime is a block timestamp in seconds, term is in seconds
 */
export function isLoanOverdue(loan: Loan | ContractLoan, currentTime?: bigint): boolean {
  if (loan.status !== 'Active') return false;
  // Block timestamps are in seconds
  const now = currentTime || BigInt(Math.floor(Date.now() / 1000));
  const dueTime = loan.startTime + loan.term;
  return now > dueTime;
}

/**
 * Get days remaining until loan is due
 * Note: startTime is a block timestamp in seconds, term is in seconds
 */
export function getDaysRemaining(loan: Loan | ContractLoan, currentTime?: bigint): number {
  // Block timestamps are in seconds
  const now = currentTime || BigInt(Math.floor(Date.now() / 1000));
  const dueTime = loan.startTime + loan.term;
  // Convert seconds to days: divide by (60 * 60 * 24) = 86400
  const secondsRemaining = dueTime - now;
  return Math.max(0, Number(secondsRemaining / 86400n));
}

