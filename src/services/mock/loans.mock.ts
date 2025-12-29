/**
 * Mock service for loans data
 * Simulates backend API responses matching contract shapes
 */

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

// Simulate network latency
const delay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Mock loans data
const mockLoans: Map<string, Loan> = new Map();
const mockLenders: Map<string, LoanLender[]> = new Map();

// Initialize with sample data
const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;
const oneHour = 60 * 60 * 1000;

const sampleLoans: Loan[] = [
  {
    loanId: '0x1111111111111111111111111111111111111111111111111111111111111111',
    borrower: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    requestedAmount: 10000000000000000000n, // 10 tokens
    fundedAmount: 10000000000000000000n, // 10 tokens
    lenderCount: 5,
    interestRate: 500n, // 5%
    penaltyRate: 200n, // 2%
    duration: BigInt(90 * 24 * 60 * 60), // 90 days
    startTime: BigInt(now - 30 * oneDay),
    dueTime: BigInt(now + 60 * oneDay),
    status: 'active',
    poolId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    createdAt: now - 30 * oneDay,
  },
  {
    loanId: '0x2222222222222222222222222222222222222222222222222222222222222222',
    borrower: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    requestedAmount: 5000000000000000000n, // 5 tokens
    fundedAmount: 3500000000000000000n, // 3.5 tokens
    lenderCount: 2,
    interestRate: 800n, // 8%
    penaltyRate: 300n, // 3%
    duration: BigInt(60 * 24 * 60 * 60), // 60 days
    startTime: BigInt(0),
    dueTime: BigInt(now + 60 * oneDay),
    status: 'funding',
    poolId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    createdAt: now - 5 * oneDay,
  },
  {
    loanId: '0x3333333333333333333333333333333333333333333333333333333333333333',
    borrower: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    requestedAmount: 20000000000000000000n, // 20 tokens
    fundedAmount: 20000000000000000000n, // 20 tokens
    lenderCount: 8,
    interestRate: 300n, // 3%
    penaltyRate: 100n, // 1%
    duration: BigInt(180 * 24 * 60 * 60), // 180 days
    startTime: BigInt(now - 120 * oneDay),
    dueTime: BigInt(now - 10 * oneDay), // Overdue
    status: 'active',
    poolId: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    createdAt: now - 120 * oneDay,
  },
  {
    loanId: '0x4444444444444444444444444444444444444444444444444444444444444444',
    borrower: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    requestedAmount: 15000000000000000000n, // 15 tokens
    fundedAmount: 15000000000000000000n, // 15 tokens
    lenderCount: 6,
    interestRate: 450n, // 4.5%
    penaltyRate: 150n, // 1.5%
    duration: BigInt(120 * 24 * 60 * 60), // 120 days
    startTime: BigInt(now - 150 * oneDay),
    dueTime: BigInt(now - 30 * oneDay),
    status: 'completed',
    poolId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    createdAt: now - 150 * oneDay,
  },
];

// Initialize mock data
sampleLoans.forEach((loan) => {
  mockLoans.set(loan.loanId, loan);

  // Create mock lenders
  const lenders: LoanLender[] = [];
  const lenderAddresses = [
    '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
    '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpNHM',
    '5CHuVpMbc9qS9Xmkh1Qr8i6X2KzXJzXJzXJzXJzXJzXJzXJzX',
    '5EYCAe5ijAx5pBTxKkFzQ5JZJZJZJZJZJZJZJZJZJZJZJZJZJZ',
    '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  ];

  for (let i = 0; i < loan.lenderCount; i++) {
    lenders.push({
      loanId: loan.loanId,
      lenderAddress: lenderAddresses[i % lenderAddresses.length],
      amount: loan.fundedAmount / BigInt(loan.lenderCount),
      contributedAt: loan.createdAt + i * oneHour,
    });
  }

  mockLenders.set(loan.loanId, lenders);
});

/**
 * Get loan by ID
 */
export async function getLoan(loanId: string): Promise<Loan | null> {
  await delay(250);

  const loan = mockLoans.get(loanId);
  return loan ? { ...loan } : null;
}

/**
 * Get loan with details
 */
export async function getLoanDetails(loanId: string): Promise<LoanDetails | null> {
  await delay(350);

  const loan = mockLoans.get(loanId);
  if (!loan) {
    return null;
  }

  const lenders = mockLenders.get(loanId) || [];
  const remainingAmount = loan.requestedAmount - loan.fundedAmount;
  const progress = Number((loan.fundedAmount * BigInt(100)) / loan.requestedAmount);
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  const daysRemaining = Number((loan.dueTime - nowSeconds) / BigInt(24 * 60 * 60));
  const isOverdue = nowSeconds > loan.dueTime && loan.status === 'active';

  // Calculate total repayment (principal + interest)
  const interest = (loan.fundedAmount * loan.interestRate) / BigInt(10000);
  const totalRepayment = loan.fundedAmount + interest;

  return {
    ...loan,
    lenders: [...lenders],
    remainingAmount,
    progress,
    daysRemaining,
    totalRepayment,
    isOverdue,
  };
}

/**
 * Get all loans
 */
export async function getAllLoans(): Promise<Loan[]> {
  await delay(400);

  return Array.from(mockLoans.values()).map((loan) => ({ ...loan }));
}

/**
 * Get loans by borrower address
 */
export async function getLoansByBorrower(borrowerAddress: string): Promise<Loan[]> {
  await delay(300);

  return Array.from(mockLoans.values())
    .filter((loan) => loan.borrower === borrowerAddress)
    .map((loan) => ({ ...loan }));
}

/**
 * Get loans by lender address
 */
export async function getLoansByLender(lenderAddress: string): Promise<Loan[]> {
  await delay(350);

  const lenderLoanIds = new Set<string>();
  mockLenders.forEach((lenders, loanId) => {
    if (lenders.some((l) => l.lenderAddress === lenderAddress)) {
      lenderLoanIds.add(loanId);
    }
  });

  return Array.from(mockLoans.values())
    .filter((loan) => lenderLoanIds.has(loan.loanId))
    .map((loan) => ({ ...loan }));
}

/**
 * Get loans by pool ID
 */
export async function getLoansByPool(poolId: string): Promise<Loan[]> {
  await delay(300);

  return Array.from(mockLoans.values())
    .filter((loan) => loan.poolId === poolId)
    .map((loan) => ({ ...loan }));
}

/**
 * Get loans by status
 */
export async function getLoansByStatus(status: LoanStatus): Promise<Loan[]> {
  await delay(250);

  return Array.from(mockLoans.values())
    .filter((loan) => loan.status === status)
    .map((loan) => ({ ...loan }));
}

/**
 * Get active loans
 */
export async function getActiveLoans(): Promise<Loan[]> {
  await delay(300);

  return Array.from(mockLoans.values())
    .filter((loan) => loan.status === 'active')
    .map((loan) => ({ ...loan }));
}

/**
 * Get funding loans (pending funding)
 */
export async function getFundingLoans(): Promise<Loan[]> {
  await delay(300);

  return Array.from(mockLoans.values())
    .filter((loan) => loan.status === 'funding' || loan.status === 'pending')
    .map((loan) => ({ ...loan }));
}

/**
 * Create a new loan request
 */
export async function createLoan(
  borrower: string,
  requestedAmount: bigint,
  interestRate: bigint,
  penaltyRate: bigint,
  duration: bigint,
  poolId: string
): Promise<Loan> {
  await delay(500);

  const loanId = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));

  const newLoan: Loan = {
    loanId,
    borrower,
    requestedAmount,
    fundedAmount: 0n,
    lenderCount: 0,
    interestRate,
    penaltyRate,
    duration,
    startTime: 0n,
    dueTime: nowSeconds + duration,
    status: 'pending',
    poolId,
    createdAt: Date.now(),
  };

  mockLoans.set(loanId, newLoan);
  mockLenders.set(loanId, []);

  return { ...newLoan };
}

/**
 * Update loan funding
 */
export async function updateLoanFunding(
  loanId: string,
  lenderAddress: string,
  amount: bigint
): Promise<boolean> {
  await delay(400);

  const loan = mockLoans.get(loanId);
  if (!loan) {
    return false;
  }

  // Update loan
  loan.fundedAmount += amount;
  loan.lenderCount += 1;

  // Update status
  if (loan.fundedAmount >= loan.requestedAmount) {
    loan.status = 'funding';
    loan.startTime = BigInt(Math.floor(Date.now() / 1000));
  } else if (loan.fundedAmount > 0n) {
    loan.status = 'funding';
  }

  // Add lender
  const lenders = mockLenders.get(loanId) || [];
  lenders.push({
    loanId,
    lenderAddress,
    amount,
    contributedAt: Date.now(),
  });
  mockLenders.set(loanId, lenders);

  return true;
}

