export interface Props {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown; // Allow additional props
}

// Pool types
export interface Pool {
  poolId: string; // Hash
  name: string;
  description: string;
  totalLiquidity: bigint; // Balance
  availableLiquidity: bigint; // Balance
  totalLoans: number;
  activeLoans: number;
  baseInterestRate: bigint; // u64 - in basis points (e.g., 500 = 5%)
  minLenders: number; // u32
  overfundingFactor: bigint; // u64 - in basis points
  createdAt: number; // Timestamp
  status: 'active' | 'paused' | 'closed';
}

export interface PoolStats {
  poolId: string;
  totalLiquidity: bigint;
  availableLiquidity: bigint;
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultRate: number; // Percentage 0-100
  averageLoanAmount: bigint;
  totalLent: bigint;
  totalRepaid: bigint;
}

// Profile types
export interface Profile {
  walletAddress: string;
  capital: bigint; // Balance in smallest unit (e.g., wei, planck)
  reputation: number; // Credit score/reputation points
  tier: 'rojo' | 'amarillo' | 'verde';
  incomeReference: string | null;
  registeredAt: number; // Timestamp
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalLent: bigint;
  totalBorrowed: bigint;
}

export interface ProfileStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalLent: bigint;
  totalBorrowed: bigint;
  averageLoanAmount: bigint;
  onTimePaymentRate: number; // Percentage 0-100
}

// Loan types - matching contract structure
// Contract status: "Active" | "Repaid" | "Defaulted"
export type LoanStatus = 'Active' | 'Repaid' | 'Defaulted';

// Contract loan structure (matches LoanManagerLoan from contract)
export interface ContractLoan {
  loanId: bigint;
  borrower: string; // AccountId32 as string
  amount: bigint; // Balance - the loan amount
  interestRate: bigint; // Interest rate (basis points or similar)
  term: bigint; // Duration in seconds
  purpose: Uint8Array | string; // Bytes - loan purpose
  startTime: bigint; // Timestamp in seconds
  status: LoanStatus; // "Active" | "Repaid" | "Defaulted"
  vouchers: string[]; // Array of AccountId32 addresses
}

// UI loan type with computed/derived fields for display
export interface Loan extends ContractLoan {
  // Computed fields
  dueTime: bigint; // startTime + term
  totalRepayment: bigint; // amount + interest
  daysRemaining: number; // Calculated from dueTime
  isOverdue: boolean; // true if current time > dueTime and status is Active
  purposeText?: string; // Decoded purpose text
}

// Extended loan details for detailed views
export interface LoanDetails extends Loan {
  // Additional UI fields
  progress?: number; // Percentage 0-100 (for funding progress if applicable)
  remainingAmount?: bigint; // For partial repayments
}

// Legacy type for backward compatibility during migration
// @deprecated Use Loan or ContractLoan instead
export interface LoanLender {
  loanId: string;
  lenderAddress: string;
  amount: bigint;
  contributedAt: number;
}
