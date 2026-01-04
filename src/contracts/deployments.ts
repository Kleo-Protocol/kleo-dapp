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
    address: '0x7d5760444f5c7905d0489253958f7e071882c9c1',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.LENDING_POOL,
    metadata: lendingPool,
    address: '0xe59e8e263757156190de42e76f76602fd39c013e',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.REPUTATION,
    metadata: reputation,
    address: '0x8c80413949a52ace94cda021b19a6ebd0339f51d',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.VOUCH,
    metadata: vouch,
    address: '0x14b3656b56e1c3330b1cd8e1a9759afbe66d9bff',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.LOAN_MANAGER,
    metadata: loanManager,
    address: '0x14b3656b56e1c3330b1cd8e1a9759afbe66d9bff',
    network: paseoAssetHub.id,
  }
];