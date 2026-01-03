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
    address: '0x899710a044f6472f9acde543063900e11ace3fc2',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.LENDING_POOL,
    metadata: lendingPool,
    address: '0xc6d7f618aceb4189dfd7a2fb703efb3811b8ecf0',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.REPUTATION,
    metadata: reputation,
    address: '0x899d7f073aa66fd8af651c82af99d7ec2677a997',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.VOUCH,
    metadata: vouch,
    address: '0xbc6e43400a06c1f0a3d7b062e4595ae8054ce147',
    network: paseoAssetHub.id,
  },
  {
    id: ContractId.LOAN_MANAGER,
    metadata: loanManager,
    address: '0x46bc2b3b3b55e62a1385d91d9985168973457134',
    network: paseoAssetHub.id,
  }
];