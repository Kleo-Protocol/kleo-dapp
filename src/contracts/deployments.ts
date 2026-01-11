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
    address: '0x20cf41bc974daee3c695085723967b394567dfc0',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.REPUTATION,
    metadata: reputation,
    address: '0x23698d954b2e170b6564535aa87831555d1aacfb',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.VOUCH,
    metadata: vouch,
    address: '0x137c8526032695a056f763dc98a2fae157105f6b',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.LOAN_MANAGER,
    metadata: loanManager,
    address: '0x6bdf4d1be5ed893759e81431705c77a53b521731',
    network: paseoAssetHub.id,
  }
];