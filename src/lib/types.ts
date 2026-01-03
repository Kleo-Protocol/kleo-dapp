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

// Loan types
export type LoanStatus = 'pending' | 'funding' | 'active' | 'completed' | 'defaulted' | 'cancelled';

export interface Loan {
  loanId: string; // Hash
  borrower: string; // Address
  requestedAmount: bigint; // Balance
  fundedAmount: bigint; // Balance
  lenderCount: number; // u32
  interestRate: bigint; // u64 - in basis points
  penaltyRate: bigint; // u64 - in basis points
  duration: bigint; // u64 - in seconds
  startTime: bigint; // Timestamp
  dueTime: bigint; // Timestamp
  status: LoanStatus;
  poolId: string; // Hash
  createdAt: number; // Timestamp for mock data
}

export interface LoanLender {
  loanId: string;
  lenderAddress: string;
  amount: bigint; // Balance
  contributedAt: number; // Timestamp
}

export interface LoanDetails extends Loan {
  lenders: LoanLender[];
  remainingAmount: bigint;
  progress: number; // Percentage 0-100
  daysRemaining: number;
  totalRepayment: bigint;
  isOverdue: boolean;
}
