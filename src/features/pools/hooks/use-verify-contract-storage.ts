/**
 * Utility hook to verify contract storage structure
 * Use this to debug storage access issues
 */
import { useContract, useTypink } from 'typink';
import { ContractId } from '@/contracts/deployments';

export function useVerifyContractStorage() {
  const { contract } = useContract(ContractId.LENDING_POOL);
  const { connectedAccount } = useTypink();

  const verifyStorage = async () => {
    if (!contract?.storage) {
      console.error('Storage API not available');
      return;
    }

    try {
      const root = await contract.storage.root();
      const keys = Object.keys(root);
      
      console.log('=== Contract Storage Verification ===');
      console.log('Available storage keys:', keys);
      console.log('Storage root object:', root);
      
      // Check for user_deposits (snake_case)
      if ('user_deposits' in root) {
        console.log('[OK] Found user_deposits (snake_case)');
        const mapping = (root as any).user_deposits;
        console.log('  Type:', typeof mapping);
        console.log('  Has get method:', typeof mapping?.get === 'function');
        
        if (connectedAccount && typeof mapping?.get === 'function') {
          const testDeposit = await mapping.get(connectedAccount.address);
          console.log('  Test deposit value:', testDeposit);
        }
      } else {
        console.log('[NOT FOUND] user_deposits (snake_case) NOT found');
      }
      
      // Check for userDeposits (camelCase)
      if ('userDeposits' in root) {
        console.log('[OK] Found userDeposits (camelCase)');
        const mapping = (root as any).userDeposits;
        console.log('  Type:', typeof mapping);
        console.log('  Has get method:', typeof mapping?.get === 'function');
        
        if (connectedAccount && typeof mapping?.get === 'function') {
          const testDeposit = await mapping.get(connectedAccount.address);
          console.log('  Test deposit value:', testDeposit);
        }
      } else {
        console.log('[NOT FOUND] userDeposits (camelCase) NOT found');
      }
      
      // Check other storage fields for reference
      console.log('\nOther storage fields:');
      keys.forEach((key) => {
        const value = (root as any)[key];
        console.log(`  ${key}:`, {
          type: typeof value,
          hasGet: typeof value?.get === 'function',
          isFunction: typeof value === 'function',
        });
      });
      
      console.log('=== End Verification ===');
    } catch (error) {
      console.error('Error verifying storage:', error);
    }
  };

  return { verifyStorage };
}

