/**
 * Utility functions for working with loans from the contract
 */

import type { ContractLoan, Loan, LoanDetails } from './types';
import type { LoanManagerLoan } from '@/contracts/types/loan-manager/types';

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
 */
export function contractLoanToLoan(contractLoan: LoanManagerLoan | ContractLoan, currentTime?: bigint): Loan {
  const now = currentTime || BigInt(Math.floor(Date.now() / 1000));
  const dueTime = contractLoan.startTime + contractLoan.term;
  const daysRemaining = Number((dueTime - now) / 86400n);
  const isOverdue = contractLoan.status === 'Active' && now > dueTime;

  // Calculate total repayment (principal + interest)
  // Interest calculation: amount * interestRate * term / (365 * 86400 * 10000)
  // Assuming interestRate is in basis points (per 10000)
  const interestAmount = (contractLoan.amount * contractLoan.interestRate * contractLoan.term) / (365n * 86400n * 10000n);
  const totalRepayment = contractLoan.amount + interestAmount;

  // Decode purpose
  const purposeText = decodePurpose(contractLoan.purpose);

  return {
    ...contractLoan,
    loanId: contractLoan.loanId,
    borrower: typeof contractLoan.borrower === 'string' 
      ? contractLoan.borrower 
      : contractLoan.borrower.toString(),
    vouchers: contractLoan.vouchers.map((v) => 
      typeof v === 'string' ? v : v.toString()
    ),
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
 */
export function isLoanOverdue(loan: Loan | ContractLoan, currentTime?: bigint): boolean {
  if (loan.status !== 'Active') return false;
  const now = currentTime || BigInt(Math.floor(Date.now() / 1000));
  const dueTime = loan.startTime + loan.term;
  return now > dueTime;
}

/**
 * Get days remaining until loan is due
 */
export function getDaysRemaining(loan: Loan | ContractLoan, currentTime?: bigint): number {
  const now = currentTime || BigInt(Math.floor(Date.now() / 1000));
  const dueTime = loan.startTime + loan.term;
  const secondsRemaining = dueTime - now;
  return Math.max(0, Number(secondsRemaining / 86400n));
}

