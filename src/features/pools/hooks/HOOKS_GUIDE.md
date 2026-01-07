# Kleo Protocol Hooks Integration Guide

This comprehensive guide explains how to use all Kleo Protocol hooks for interacting with smart contracts. This guide is designed for LLMs and developers to easily integrate contract functionality into the application.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Query Hooks](#query-hooks)
4. [Transaction Hooks](#transaction-hooks)
5. [Common Patterns](#common-patterns)
6. [Complete Flow Examples](#complete-flow-examples)
7. [Type Definitions](#type-definitions)
8. [Error Handling](#error-handling)

## Introduction

Kleo Protocol is a decentralized lending protocol built on Polkadot using Ink! smart contracts. The protocol enables undercollateralized lending through:

- **Reputation System**: Users earn "stars" that represent creditworthiness
- **Social Vouching**: Community members stake reputation and capital to vouch for borrowers
- **Fixed Interest Rates**: Interest rates are calculated and fixed at loan creation
- **Dynamic Pool Rates**: Lending pool interest rates adjust based on utilization

All hooks use Typink for contract interactions and React Query for state management.

## Architecture Overview

### Contract Structure

The protocol consists of five main contracts:

1. **Config** - Central parameter store (admin-managed, not exposed via hooks)
2. **Reputation** - Star-based credit scoring system
3. **Lending Pool** - Manages liquidity with dynamic interest rates
4. **Vouch** - Social guarantee system
5. **Loan Manager** - Orchestrates the entire loan lifecycle

### Hook Categories

- **Query Hooks**: Read-only operations using `contract.query.*`
- **Transaction Hooks**: Write operations using `contract.tx.*` with `signAndSend()`

### Decimal Handling

**Critical**: The protocol uses different decimal precisions:

- **18 decimals**: Chain format (transfers, total liquidity, repayment amounts, user yield)
- **10 decimals**: Storage format (user deposits, withdraw amounts, disburse amounts)
- **12 decimals**: Network default (Asset Hub chains)

Always convert between formats when needed:
```typescript
// Convert human-readable to 18 decimals
const amount18 = BigInt(Math.floor(amount * 10 ** 18));

// Convert 18 decimals to human-readable
const humanReadable = Number(amount18) / 10 ** 18;

// Convert 10 decimals (storage) to 18 decimals (chain)
const amount18 = amount10 * 10n ** 8n;
```

### AccountId vs Address

- **AccountId**: 32-byte Substrate address (for user accounts)
- **Address (H160)**: 20-byte contract address (for contract addresses)
- Contract addresses from `deployments.ts` are already H160 format
- Use `toEvmAddress()` from typink to convert if needed

## Query Hooks

### Loan Queries

Located in: `src/features/pools/hooks/use-loan-queries.ts`

#### `useLoan(loanId)`

Query loan details from the loan manager contract.

```typescript
import { useLoan } from '@/features/pools/hooks/use-loan-queries';

function LoanDetails({ loanId }: { loanId: bigint }) {
  const { data: loan, isLoading, error } = useLoan(loanId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!loan) return <div>Loan not found</div>;

  return (
    <div>
      <p>Loan ID: {loan.loanId.toString()}</p>
      <p>Status: {loan.status}</p>
      <p>Amount: {Number(loan.amount) / 10 ** 18} tokens</p>
      <p>Borrower: {loan.borrower}</p>
      <p>Interest Rate: {Number(loan.interestRate)}</p>
    </div>
  );
}
```

**Return Type**: `LoanManagerLoan | null`

**Loan Status Values**: `"Pending" | "Active" | "Repaid" | "Defaulted"`

#### `useRepaymentAmount(loanId)`

Query the fixed repayment amount for a loan (18 decimals).

```typescript
import { useRepaymentAmount } from '@/features/pools/hooks/use-loan-queries';

function RepaymentInfo({ loanId }: { loanId: bigint }) {
  const { data: repaymentAmount } = useRepaymentAmount(loanId);

  if (!repaymentAmount) return null;

  const humanReadable = Number(repaymentAmount) / 10 ** 18;
  return <div>Repayment Amount: {humanReadable} tokens</div>;
}
```

**Return Type**: `bigint | null` (18 decimals)

#### `usePendingLoans()`

Query all pending loan IDs.

```typescript
import { usePendingLoans } from '@/features/pools/hooks/use-loan-queries';

function PendingLoansList() {
  const { data: pendingLoanIds } = usePendingLoans();

  return (
    <div>
      <h2>Pending Loans</h2>
      {pendingLoanIds?.map((loanId) => (
        <div key={loanId.toString()}>Loan ID: {loanId.toString()}</div>
      ))}
    </div>
  );
}
```

**Return Type**: `bigint[]`

#### `useActiveLoans()`

Query all active loan IDs.

```typescript
import { useActiveLoans } from '@/features/pools/hooks/use-loan-queries';

function ActiveLoansList() {
  const { data: activeLoanIds } = useActiveLoans();

  return (
    <div>
      <h2>Active Loans</h2>
      {activeLoanIds?.map((loanId) => (
        <div key={loanId.toString()}>Loan ID: {loanId.toString()}</div>
      ))}
    </div>
  );
}
```

**Return Type**: `bigint[]`

#### `useLoanStatus(loanId)`

Helper to determine if a loan is overdue or defaulted.

```typescript
import { useLoanStatus } from '@/features/pools/hooks/use-loan-queries';

function LoanStatusBadge({ loanId }: { loanId: bigint }) {
  const { data: status } = useLoanStatus(loanId);

  if (!status) return null;

  if (status.isDefaulted) {
    return <span className="badge error">Defaulted</span>;
  }
  if (status.isOverdue) {
    return <span className="badge warning">Overdue</span>;
  }
  if (status.isRepaid) {
    return <span className="badge success">Repaid</span>;
  }
  if (status.timeUntilDue) {
    const daysUntilDue = Math.floor(status.timeUntilDue / (1000 * 60 * 60 * 24));
    return <span className="badge">Due in {daysUntilDue} days</span>;
  }

  return <span className="badge">Active</span>;
}
```

**Return Type**: 
```typescript
{
  isOverdue: boolean;
  isDefaulted: boolean;
  isRepaid: boolean;
  timeUntilDue: number | null; // milliseconds until due date
}
```

### Pool Info Queries

Located in: `src/features/pools/hooks/use-pool-info-queries.ts`

#### `useTotalLiquidity()`

Query total pool liquidity (18 decimals).

```typescript
import { useTotalLiquidity } from '@/features/pools/hooks/use-pool-info-queries';

function PoolLiquidity() {
  const { data: totalLiquidity } = useTotalLiquidity();

  if (!totalLiquidity) return null;

  const humanReadable = Number(totalLiquidity) / 10 ** 18;
  return <div>Total Liquidity: {humanReadable.toLocaleString()} tokens</div>;
}
```

**Return Type**: `bigint` (18 decimals)

#### `useTotalBorrowed()`

Query total borrowed amount from storage.

```typescript
import { useTotalBorrowed } from '@/features/pools/hooks/use-pool-info-queries';

function TotalBorrowed() {
  const { data: totalBorrowed } = useTotalBorrowed();

  if (!totalBorrowed) return null;

  // Note: totalBorrowed is in storage format (10 decimals)
  const humanReadable = Number(totalBorrowed) / 10 ** 10;
  return <div>Total Borrowed: {humanReadable.toLocaleString()} tokens</div>;
}
```

**Return Type**: `bigint` (10 decimals - storage format)

#### `usePoolUtilization()`

Calculate pool utilization percentage.

```typescript
import { usePoolUtilization } from '@/features/pools/hooks/use-pool-info-queries';

function UtilizationGauge() {
  const { data: utilization } = usePoolUtilization();

  if (utilization === undefined) return null;

  return (
    <div>
      <div>Pool Utilization: {utilization.toFixed(2)}%</div>
      <progress value={utilization} max={100} />
    </div>
  );
}
```

**Return Type**: `number` (percentage, e.g., 75.5 for 75.5%)

#### `useUserYield(userAddress, withAccrual?)`

Query user's accrued yield (18 decimals).

```typescript
import { useUserYield } from '@/features/pools/hooks/use-pool-info-queries';

function UserYield({ userAddress }: { userAddress: string }) {
  // With accrual (more accurate, but writes to contract)
  const { data: yieldWithAccrual } = useUserYield(userAddress, true);
  
  // Without accrual (read-only, faster)
  const { data: yieldReadOnly } = useUserYield(userAddress, false);

  const yieldAmount = yieldWithAccrual ?? yieldReadOnly ?? 0n;
  const humanReadable = Number(yieldAmount) / 10 ** 18;

  return <div>Your Yield: {humanReadable.toFixed(6)} tokens</div>;
}
```

**Return Type**: `bigint` (18 decimals)

**Parameters**:
- `userAddress`: User's account address (AccountId)
- `withAccrual`: If `true`, accrues interest before calculating (default: `false`)

### Vouch Queries

Located in: `src/features/pools/hooks/use-vouch-queries.ts`

#### `useVouchesForLoan(loanId)`

Query count of active vouches for a loan.

```typescript
import { useVouchesForLoan } from '@/features/pools/hooks/use-vouch-queries';

function VouchCount({ loanId }: { loanId: bigint }) {
  const { data: vouchCount } = useVouchesForLoan(loanId);

  return <div>Vouches: {vouchCount ?? 0}</div>;
}
```

**Return Type**: `number`

#### `useVouchersForLoan(loanId)`

Query all voucher addresses for a loan.

```typescript
import { useVouchersForLoan } from '@/features/pools/hooks/use-vouch-queries';

function VoucherList({ loanId }: { loanId: bigint }) {
  const { data: vouchers } = useVouchersForLoan(loanId);

  return (
    <div>
      <h3>Vouchers</h3>
      {vouchers?.map((voucher, index) => (
        <div key={index}>{voucher}</div>
      ))}
    </div>
  );
}
```

**Return Type**: `AccountId32[]`

#### `useBorrowerExposure(borrowerAddress)`

Query borrower's total exposure.

```typescript
import { useBorrowerExposure } from '@/features/pools/hooks/use-vouch-queries';

function BorrowerExposure({ borrowerAddress }: { borrowerAddress: string }) {
  const { data: exposure } = useBorrowerExposure(borrowerAddress);

  if (!exposure) return null;

  const humanReadable = Number(exposure) / 10 ** 18;
  return <div>Total Exposure: {humanReadable} tokens</div>;
}
```

**Return Type**: `bigint`

### Reputation Queries

Located in: `src/features/profile/hooks/use-reputation-queries.ts`

#### `useStars(userAddress)`

Query user's star count.

```typescript
import { useStars } from '@/features/profile/hooks/use-reputation-queries';

function StarDisplay({ userAddress }: { userAddress: string }) {
  const { data: stars } = useStars(userAddress);

  return <div>Stars: {stars ?? 0} ⭐</div>;
}
```

**Return Type**: `number`

#### `useCanVouch(userAddress)`

Check if user can vouch for others (has minimum stars).

```typescript
import { useCanVouch } from '@/features/profile/hooks/use-reputation-queries';

function VouchButton({ userAddress }: { userAddress: string }) {
  const { data: canVouch } = useCanVouch(userAddress);

  return (
    <button disabled={!canVouch}>
      {canVouch ? 'Vouch for Loan' : 'Insufficient Stars to Vouch'}
    </button>
  );
}
```

**Return Type**: `boolean`

## Transaction Hooks

Located in: `src/features/pools/hooks/use-loan-transactions.ts`

All transaction hooks require:
- Connected wallet (`useTypink().connectedAccount`)
- Sufficient balance for transaction fees
- Proper error handling

### `useRequestLoan()`

Request a new loan.

```typescript
import { useRequestLoan } from '@/features/pools/hooks/use-loan-transactions';
import { useTypink } from 'typink';

function RequestLoanForm() {
  const { requestLoan } = useRequestLoan();
  const { network } = useTypink();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const decimals = network?.decimals ?? 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert amount to bigint (18 decimals for loan amount)
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
      
      // Loan term in milliseconds (e.g., 30 days)
      const loanTerm = BigInt(30 * 24 * 60 * 60 * 1000);

      await requestLoan(amountBigInt, loanTerm);
      
      setAmount('');
      alert('Loan requested successfully!');
    } catch (error) {
      console.error('Error requesting loan:', error);
      alert('Failed to request loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Loan amount"
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Request Loan'}
      </button>
    </form>
  );
}
```

**Parameters**:
- `amount`: `bigint` - Loan amount (18 decimals)
- `loanTerm`: `bigint` - Loan term in milliseconds

**Returns**: `{ requestLoan: (amount: bigint, loanTerm: bigint) => Promise<void> }`

### `useVouchForLoan()`

Vouch for a pending loan.

```typescript
import { useVouchForLoan } from '@/features/pools/hooks/use-loan-transactions';

function VouchForm({ loanId }: { loanId: bigint }) {
  const { vouchForLoan } = useVouchForLoan();
  const [stars, setStars] = useState('');
  const [capitalPercent, setCapitalPercent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await vouchForLoan(
        loanId,
        parseInt(stars),
        parseInt(capitalPercent)
      );
      
      setStars('');
      setCapitalPercent('');
      alert('Vouch submitted successfully!');
    } catch (error) {
      console.error('Error vouching:', error);
      alert('Failed to vouch for loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={stars}
        onChange={(e) => setStars(e.target.value)}
        placeholder="Stars to stake"
      />
      <input
        type="number"
        value={capitalPercent}
        onChange={(e) => setCapitalPercent(e.target.value)}
        placeholder="Capital percent (0-100)"
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Vouch for Loan'}
      </button>
    </form>
  );
}
```

**Parameters**:
- `loanId`: `bigint` - Loan ID to vouch for
- `stars`: `number` - Number of stars to stake
- `capitalPercent`: `number` - Percentage of deposit to stake (0-100)

**Returns**: `{ vouchForLoan: (loanId: bigint, stars: number, capitalPercent: number) => Promise<void> }`

### `useRepayLoan()`

Repay an active loan (payable transaction).

```typescript
import { useRepayLoan } from '@/features/pools/hooks/use-loan-transactions';
import { useRepaymentAmount } from '@/features/pools/hooks/use-loan-queries';

function RepayLoanButton({ loanId }: { loanId: bigint }) {
  const { repayLoan } = useRepayLoan();
  const { data: repaymentAmount } = useRepaymentAmount(loanId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRepay = async () => {
    if (!repaymentAmount) {
      alert('Repayment amount not available');
      return;
    }

    setIsSubmitting(true);

    try {
      // repaymentAmount is already in 18 decimals
      await repayLoan(loanId, repaymentAmount);
      
      alert('Loan repaid successfully!');
    } catch (error) {
      console.error('Error repaying loan:', error);
      alert('Failed to repay loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!repaymentAmount) return null;

  const humanReadable = Number(repaymentAmount) / 10 ** 18;

  return (
    <div>
      <p>Repayment Amount: {humanReadable} tokens</p>
      <button onClick={handleRepay} disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Repay Loan'}
      </button>
    </div>
  );
}
```

**Parameters**:
- `loanId`: `bigint` - Loan ID to repay
- `repaymentAmount`: `bigint` - Exact repayment amount (18 decimals)

**Returns**: `{ repayLoan: (loanId: bigint, repaymentAmount: bigint) => Promise<void> }`

**Note**: This is a payable transaction. The `repaymentAmount` is sent as the transaction value.

### `useCheckDefault()`

Check and process loan defaults (anyone can call).

```typescript
import { useCheckDefault } from '@/features/pools/hooks/use-loan-transactions';

function CheckDefaultButton({ loanId }: { loanId: bigint }) {
  const { checkDefault } = useCheckDefault();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckDefault = async () => {
    setIsSubmitting(true);

    try {
      await checkDefault(loanId);
      alert('Default processed successfully');
    } catch (error) {
      console.error('Error checking default:', error);
      alert('Failed to process default');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button onClick={handleCheckDefault} disabled={isSubmitting}>
      {isSubmitting ? 'Processing...' : 'Check Default'}
    </button>
  );
}
```

**Parameters**:
- `loanId`: `bigint` - Loan ID to check

**Returns**: `{ checkDefault: (loanId: bigint) => Promise<void> }`

**Note**: This function can be called by anyone. It automatically:
- Checks if loan is overdue (past term + grace period)
- Slashes borrower's stars
- Resolves vouches as failed
- Slashes voucher capital

## Common Patterns

### Decimal Conversion Utilities

```typescript
/**
 * Convert human-readable amount to 18 decimals (chain format)
 */
function toChainFormat(amount: number): bigint {
  return BigInt(Math.floor(amount * 10 ** 18));
}

/**
 * Convert 18 decimals (chain format) to human-readable
 */
function fromChainFormat(amount: bigint): number {
  return Number(amount) / 10 ** 18;
}

/**
 * Convert 10 decimals (storage format) to 18 decimals (chain format)
 */
function storageToChain(storageAmount: bigint): bigint {
  return storageAmount * 10n ** 8n;
}

/**
 * Convert 18 decimals (chain format) to 10 decimals (storage format)
 */
function chainToStorage(chainAmount: bigint): bigint {
  return chainAmount / 10n ** 8n;
}
```

### Query Invalidation

After successful transactions, invalidate related queries:

```typescript
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    // Invalidate specific queries
    queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
    queryClient.invalidateQueries({ queryKey: ['loans', 'pending'] });
    
    // Or invalidate all queries with a prefix
    queryClient.invalidateQueries({ queryKey: ['loan'] });
  };
}
```

### Error Handling

All transaction hooks throw errors that should be caught:

```typescript
try {
  await requestLoan(amount, term);
  // Success
} catch (error) {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('InsufficientReputation')) {
      alert('You need more stars to request this loan');
    } else if (error.message.includes('InsufficientVouches')) {
      alert('Loan needs more vouches');
    } else {
      alert('Transaction failed: ' + error.message);
    }
  }
}
```

## Complete Flow Examples

### Full Loan Lifecycle

```typescript
import { useState } from 'react';
import { useRequestLoan, useVouchForLoan, useRepayLoan } from '@/features/pools/hooks/use-loan-transactions';
import { useLoan, useRepaymentAmount } from '@/features/pools/hooks/use-loan-queries';
import { useStars } from '@/features/profile/hooks/use-reputation-queries';
import { useTypink } from 'typink';

function LoanLifecycleDemo() {
  const { connectedAccount } = useTypink();
  const { requestLoan } = useRequestLoan();
  const { vouchForLoan } = useVouchForLoan();
  const { repayLoan } = useRepayLoan();
  
  const [loanId, setLoanId] = useState<bigint | null>(null);
  const { data: loan } = useLoan(loanId);
  const { data: repaymentAmount } = useRepaymentAmount(loanId);
  const { data: stars } = useStars(connectedAccount?.address);

  // Step 1: Request Loan
  const handleRequestLoan = async () => {
    const amount = toChainFormat(100); // 100 tokens
    const term = BigInt(30 * 24 * 60 * 60 * 1000); // 30 days
    
    try {
      await requestLoan(amount, term);
      // Loan ID would be returned from the transaction
      // In practice, you'd extract it from the transaction events
      alert('Loan requested! Check pending loans for the loan ID.');
    } catch (error) {
      console.error('Failed to request loan:', error);
    }
  };

  // Step 2: Vouch for Loan
  const handleVouch = async () => {
    if (!loanId) return;
    
    try {
      await vouchForLoan(loanId, 10, 10); // 10 stars, 10% capital
      alert('Vouch submitted!');
    } catch (error) {
      console.error('Failed to vouch:', error);
    }
  };

  // Step 3: Repay Loan
  const handleRepay = async () => {
    if (!loanId || !repaymentAmount) return;
    
    try {
      await repayLoan(loanId, repaymentAmount);
      alert('Loan repaid!');
    } catch (error) {
      console.error('Failed to repay:', error);
    }
  };

  return (
    <div>
      <h2>Loan Lifecycle Demo</h2>
      
      <div>
        <h3>Step 1: Request Loan</h3>
        <button onClick={handleRequestLoan}>Request 100 Token Loan</button>
      </div>

      {loanId && (
        <div>
          <h3>Step 2: Vouch for Loan</h3>
          <p>Loan Status: {loan?.status}</p>
          {loan?.status === 'Pending' && (
            <button onClick={handleVouch}>
              Vouch (You have {stars} stars)
            </button>
          )}
        </div>
      )}

      {loanId && loan?.status === 'Active' && (
        <div>
          <h3>Step 3: Repay Loan</h3>
          <p>Repayment Amount: {repaymentAmount ? fromChainFormat(repaymentAmount) : 'Loading...'} tokens</p>
          <button onClick={handleRepay}>Repay Loan</button>
        </div>
      )}
    </div>
  );
}
```

### Pool Utilization Monitoring

```typescript
import { usePoolUtilization, useTotalLiquidity, useTotalBorrowed } from '@/features/pools/hooks/use-pool-info-queries';

function PoolDashboard() {
  const { data: utilization } = usePoolUtilization();
  const { data: totalLiquidity } = useTotalLiquidity();
  const { data: totalBorrowed } = useTotalBorrowed();

  if (!utilization || !totalLiquidity) return <div>Loading...</div>;

  const liquidityHuman = fromChainFormat(totalLiquidity);
  const borrowedHuman = totalBorrowed ? fromChainFormat(storageToChain(totalBorrowed)) : 0;

  return (
    <div>
      <h2>Pool Dashboard</h2>
      <div>
        <p>Total Liquidity: {liquidityHuman.toLocaleString()} tokens</p>
        <p>Total Borrowed: {borrowedHuman.toLocaleString()} tokens</p>
        <p>Utilization: {utilization.toFixed(2)}%</p>
        <progress value={utilization} max={100} />
        
        {utilization > 80 && (
          <p className="warning">High utilization! Consider depositing more liquidity.</p>
        )}
      </div>
    </div>
  );
}
```

## Type Definitions

### Loan Types

```typescript
type LoanManagerLoan = {
  loanId: bigint;
  interestRate: bigint;
  term: bigint; // milliseconds
  startTime: bigint; // milliseconds timestamp
  amount: bigint; // 18 decimals
  borrower: AccountId32;
  status: LoanManagerLoanStatus;
  totalRepaymentAmount: bigint; // 18 decimals
};

type LoanManagerLoanStatus = "Pending" | "Active" | "Repaid" | "Defaulted";
```

### Vouch Types

```typescript
type VouchVouchRelationship = {
  loanId: bigint;
  stakedStars: number;
  stakedCapital: bigint;
  createdAt: bigint;
  status: VouchStatus;
};

type VouchStatus = "Active" | "Fulfilled" | "Defaulted";
```

### Reputation Types

```typescript
type ReputationUserReputation = {
  stars: number;
  starsAtStake: number;
  loanHistory: Array<ReputationLoanStat>;
  vouchHistory: Array<ReputationVouchStat>;
  creationTime: bigint;
  banned: boolean;
};
```

## Error Handling

### Common Errors

- **InsufficientReputation**: User doesn't have enough stars for the loan tier
- **InsufficientVouches**: Loan doesn't have enough vouches yet
- **LoanNotFound**: Loan ID doesn't exist
- **LoanNotActive**: Loan is not in Active status
- **InvalidRepaymentAmount**: Repayment amount doesn't match required amount
- **NotEnoughStars**: Voucher doesn't have enough stars to stake
- **NotEnoughCapital**: Voucher doesn't have enough deposit to stake

### Error Handling Pattern

```typescript
import { isContractDispatchError } from 'dedot/contracts';
import type { LoanManagerContractApi } from '@/contracts/types/loan-manager';

try {
  await requestLoan(amount, term);
} catch (error: any) {
  if (isContractDispatchError<LoanManagerContractApi>(error)) {
    const { dispatchError } = error;
    // Handle contract-specific errors
    console.error('Contract error:', dispatchError);
  } else if (error instanceof Error) {
    // Handle general errors
    console.error('Error:', error.message);
  }
}
```

## Best Practices

1. **Always check wallet connection** before calling transaction hooks
2. **Validate amounts** before converting to bigint
3. **Handle loading states** for better UX
4. **Invalidate queries** after successful transactions
5. **Use proper decimal conversions** based on context
6. **Check loan status** before attempting operations
7. **Display user-friendly error messages** for contract errors
8. **Use `withAccrual: true`** for accurate yield calculations when needed

## Integration Checklist

When integrating hooks into a new component:

- [ ] Import required hooks
- [ ] Check wallet connection with `useTypink()`
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Convert decimals appropriately
- [ ] Invalidate queries after transactions
- [ ] Display user-friendly messages
- [ ] Test with different account states
- [ ] Handle edge cases (no data, null values)

---

For more information about Kleo Protocol, see the [contracts documentation](../../../../contracts/README.md).

