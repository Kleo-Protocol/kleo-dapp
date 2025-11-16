'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { txToaster, useContract, useContractQuery, useContractTx, useTypink } from 'typink';
import { ContractId } from '@/contracts/deployments';
import { TrustOracleContractApi } from '@/contracts/types/trust-oracle';
import { addressToH160, normalizeHexAddress } from '@/lib/trust';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlertIcon, ShieldPlusIcon } from 'lucide-react';
import type { ISubmittableResult } from 'dedot/types';

export function TrustActionsCard() {
  const { connectedAccount } = useTypink();
  const { contract: trustOracle } = useContract<TrustOracleContractApi>(ContractId.TRUST_ORACLE);

  const caller = useMemo(() => addressToH160(connectedAccount?.address), [connectedAccount?.address]);
  const [target, setTarget] = useState('');
  const [amount, setAmount] = useState('');

  const borrower = useMemo(() => addressToH160(target), [target]);

  const callerRoleQuery = useContractQuery(
    caller && trustOracle
      ? {
          contract: trustOracle,
          fn: 'getRole',
          args: [caller],
          watch: true,
        }
      : undefined,
  );

  const ownerQuery = useContractQuery(
    trustOracle
      ? {
          contract: trustOracle,
          fn: 'getOwner',
          watch: true,
        }
      : undefined,
  );
  console.log('Owner address:', ownerQuery?.data);

  const installerTx = useContractTx(trustOracle, 'recordInstallmentPaid');
  const penaltyTx = useContractTx(trustOracle, 'recordMissedPayment');
  const guarantorTx = useContractTx(trustOracle, 'recordGuarantorAdded');
  const identityTx = useContractTx(trustOracle, 'recordIdentityVerified');
  const authorizeTx = useContractTx(trustOracle, 'authorizeCaller');

  const isAuthorized = callerRoleQuery?.data === 'Owner' || callerRoleQuery?.data === 'Authorized';
  const isOwner = ownerQuery?.data && normalizeHexAddress(ownerQuery.data) === normalizeHexAddress(connectedAccount?.address);

  const canSubmit = !!trustOracle && !!borrower && isAuthorized;

  type ContractTxRunner = ReturnType<typeof useContractTx>;

  const runTx = async (tx: ContractTxRunner, args: unknown[], successMessage: string) => {
    if (!trustOracle || !borrower) {
      toast.error('Enter a valid borrower address (0x...)');
      return;
    }

    if (!isAuthorized) {
      toast.error('You are not authorized to update trust scores.');
      return;
    }

    const toaster = txToaster('Signing transaction...');

    try {
      await tx.signAndSend({
        args,
        callback: (result: ISubmittableResult) => toaster.onTxProgress(result),
      });
      toast.success(successMessage);
      setAmount('');
    } catch (error: any) {
      console.error(error);
      toaster.onTxError(error);
    }
  };

  const handleRecordPayment = async () => {
    if (!borrower) {
      toast.error('Enter a valid borrower address.');
      return;
    }

    const parsedAmount = amount ? BigInt(amount) : undefined;
    if (!parsedAmount || parsedAmount <= 0n) {
      toast.error('Provide a positive payment amount (raw units).');
      return;
    }

    await runTx(installerTx, [borrower, parsedAmount], 'Installment recorded');
  };

  const handleMissedPayment = async () => {
    if (!borrower) {
      toast.error('Enter a valid borrower address.');
      return;
    }
    await runTx(penaltyTx, [borrower], 'Missed payment recorded');
  };

  const handleGuarantor = async () => {
    if (!borrower) {
      toast.error('Enter a valid borrower address.');
      return;
    }
    await runTx(guarantorTx, [borrower], 'Guarantor added');
  };

  const handleIdentity = async () => {
    if (!borrower) {
      toast.error('Enter a valid borrower address.');
      return;
    }
    await runTx(identityTx, [borrower], 'Identity verification recorded');
  };

  const handleAuthorizeCaller = async () => {
    if (!trustOracle || !isOwner) {
      toast.error('Only the oracle owner can authorize callers.');
      return;
    }

    const targetAddress = addressToH160(target);
    if (!targetAddress) {
      toast.error('Provide a valid borrower address to authorize.');
      return;
    }

    const toaster = txToaster('Authorizing caller...');

    try {
      await authorizeTx.signAndSend({
        args: [targetAddress],
        callback: (result: ISubmittableResult) => toaster.onTxProgress(result),
      });
      toast.success('Caller authorized');
    } catch (error: any) {
      console.error(error);
      toaster.onTxError(error);
    }
  };

  const showBorrowerHint = target && !borrower;

  return (
    <Card className='h-full bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
      <CardHeader>
        <CardTitle className='text-2xl font-semibold'>Trust Actions</CardTitle>
        <p className='text-sm text-muted-foreground'>Authorized lenders can write new trust events directly on-chain.</p>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='space-y-2'>
          <Label htmlFor='borrower'>Borrower address</Label>
          <Input
            id='borrower'
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder='0x...'
            className='font-mono'
            autoComplete='off'
          />
          {showBorrowerHint && <p className='text-xs text-amber-500'>Provide a 0x-prefixed 20-byte address.</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='amount'>Installment amount (raw)</Label>
          <Input
            id='amount'
            type='number'
            inputMode='numeric'
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder='1000000000000'
          />
          <p className='text-xs text-muted-foreground'>Optional field used when recording payments.</p>
        </div>

        {!isAuthorized && (
          <div className='flex items-start gap-2 rounded-lg border border-amber-400/50 bg-amber-500/5 p-3 text-sm text-amber-600 dark:text-amber-400'>
            <ShieldAlertIcon className='mt-0.5 h-4 w-4' />
            <div>
              Only owner/authorized callers can push trust events. Ask an admin to authorize <span className='font-mono text-xs'>{normalizeHexAddress(connectedAccount?.address) ?? 'your account'}</span>.
            </div>
          </div>
        )}

        {isOwner && (
          <div className='rounded-lg border border-green-500/40 bg-green-500/5 p-3 text-sm text-green-600 dark:text-green-400'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <p className='flex-1'>Owner shortcut: authorize the typed address directly.</p>
              <Button
                variant='outline'
                size='sm'
                onClick={handleAuthorizeCaller}
                disabled={!target || authorizeTx.inBestBlockProgress}>
                <ShieldPlusIcon className='mr-2 h-4 w-4' />
                {authorizeTx.inBestBlockProgress ? 'Authorizing...' : 'Authorize caller'}
              </Button>
            </div>
          </div>
        )}

        <div className='grid gap-3 md:grid-cols-2'>
          <Button onClick={handleRecordPayment} disabled={!canSubmit || installerTx.inBestBlockProgress}>
            {installerTx.inBestBlockProgress ? 'Recording...' : 'Record installment paid'}
          </Button>
          <Button variant='secondary' onClick={handleMissedPayment} disabled={!canSubmit || penaltyTx.inBestBlockProgress}>
            {penaltyTx.inBestBlockProgress ? 'Submitting...' : 'Mark missed payment'}
          </Button>
          <Button variant='outline' onClick={handleGuarantor} disabled={!canSubmit || guarantorTx.inBestBlockProgress}>
            {guarantorTx.inBestBlockProgress ? 'Submitting...' : 'Add guarantor credit'}
          </Button>
          <Button variant='outline' onClick={handleIdentity} disabled={!canSubmit || identityTx.inBestBlockProgress}>
            {identityTx.inBestBlockProgress ? 'Submitting...' : 'Identity verified'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
