import { ContractDeployment, paseoAssetHub } from 'typink';
import config from './artifacts/config/config.json';
import lendingPool from './artifacts/lending_pool/lending_pool.json';
import reputation from './artifacts/reputation/reputation.json';
import vouch from './artifacts/vouch/vouch.json';
import loanManager from './artifacts/loan_manager/loan_manager.json';
 
export enum ContractId {
  CONFIG = 'config',
  LENDING_POOL = 'lending_pool',
  REPUTATION = 'reputation',
  VOUCH = 'vouch',
  LOAN_MANAGER = 'loan_manager'
}

export const deployments: ContractDeployment[] = [
  {
    id: ContractId.CONFIG,
    metadata: config,
    address: '0xc04fc43ab259f0fa434aabecbefe14bfd1f1b015',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.LENDING_POOL,
    metadata: lendingPool,
    address: '0xfe5836a75cb12f0790ba4eec0ca1fd195e2dfc0e',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.REPUTATION,
    metadata: reputation,
    address: '0x08c74cdce4035d07a045db998317658bef243e7d',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.VOUCH,
    metadata: vouch,
    address: '0x688d33d7eb821f89ed0abc97c3164012d351d70a',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.LOAN_MANAGER,
    metadata: loanManager,
    address: '0xaa3851566916bcf5a74cc0328480218726b25779',
    network: paseoAssetHub.id,
  }
];