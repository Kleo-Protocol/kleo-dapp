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
    address: '0x4efc153ecf35c8254a5118287f92e89f508de891',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.REPUTATION,
    metadata: reputation,
    address: '0xa1a2f9a965455b0947bee86ae18ad4e63ee2e883',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.VOUCH,
    metadata: vouch,
    address: '0x8ab2a6dc7b0e5609926b34434562a9ddaeaeec96',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.LOAN_MANAGER,
    metadata: loanManager,
    address: '0x7b6890f3dc66bfe0fbc626c3fd4fe7cf671ba0f2',
    network: paseoAssetHub.id,
  }
];