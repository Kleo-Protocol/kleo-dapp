import { cryptoWaitReady } from '@polkadot/util-crypto';
import { useAuthStore } from '@/store/authStore';

const APP_NAME = 'Kleo Protocol DApp';

async function getPolkadotExtension() {
  if (typeof window === 'undefined') {
    throw new Error('Polkadot extension is only available in the browser');
  }
  const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp');
  return { web3Accounts, web3Enable };
}

export async function connectWallet(): Promise<void> {
  const { setError, setAccounts } = useAuthStore.getState();

  try {
    useAuthStore.setState({ status: 'connecting', error: undefined });

    await cryptoWaitReady();

    const { web3Enable, web3Accounts } = await getPolkadotExtension();
    const extensions = await web3Enable(APP_NAME);

    if (extensions.length === 0) {
      throw new Error(
        'No Polkadot wallet extension found. Please install a wallet extension like Polkadot.js, Talisman, or SubWallet.',
      );
    }

    const accounts = await web3Accounts();

    if (accounts.length === 0) {
      throw new Error('No accounts found in wallet. Please create an account in your wallet extension.');
    }

    setAccounts(accounts);
    useAuthStore.setState({ status: 'connected', error: undefined });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect wallet';
    setError(message);
    useAuthStore.setState({ status: 'error' });
    throw error;
  }
}

export function disconnectWallet(): void {
  const { reset } = useAuthStore.getState();
  reset();
}
