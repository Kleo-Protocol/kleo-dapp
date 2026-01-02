'use client';

import { deployments } from '@/contracts/deployments';
import { Props } from '@/lib/types';
import { polkadotjs, setupTxToaster, SonnerAdapter, subwallet, talisman, TypinkProvider, paseoAssetHub } from 'typink';
import { toast } from 'sonner';

// Supported networks configuration
const SUPPORTED_NETWORKS = [paseoAssetHub];
// Uncomment the following lines to enable the development network: https://github.com/paritytech/substrate-contracts-node
// if (process.env.NODE_ENV === "development") {
//   SUPPORTED_NETWORKS.push(development);
// }

// Supported wallets
const SUPPORTED_WALLETS = [subwallet, talisman, polkadotjs];

setupTxToaster({
  adapter: new SonnerAdapter(toast),
});

export function AppProvider({ children }: Props) {
  return (
    <TypinkProvider
      appName='Kleo Protocol'
      deployments={deployments}
      supportedNetworks={SUPPORTED_NETWORKS}
      defaultNetworkId={paseoAssetHub.id}
      cacheMetadata={true}
      wallets={SUPPORTED_WALLETS}>
      {children}
    </TypinkProvider>
  );
}
