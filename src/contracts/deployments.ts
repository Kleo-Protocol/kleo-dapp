import { ContractDeployment, passetHub } from 'typink';
import loanManager from './artifacts/loan_manager/loan_manager.json';
import trustGraph from './artifacts/trust_graph/trust_graph.json';
import config from './artifacts/config/config.json';

export enum ContractId {
  LOAN_MANAGER = 'loan_manager',
  TRUST_GRAPH = 'trust_graph',
  CONFIG = 'config',
}

export const deployments: ContractDeployment[] = [
  {
    id: ContractId.LOAN_MANAGER,
    metadata: loanManager,
    address: '0x6e1c9a541b9377adec304727136706f53af077e3',
    network: passetHub.id,
  },
  {
    id: ContractId.TRUST_GRAPH,
    metadata: trustGraph,
    address: '0x4cc48bfcba936d0cac8d8f3051cb6ade752b4e83',
    network: passetHub.id,
  },
  {
    id: ContractId.CONFIG,
    metadata: config,
    address: '0x46bc2b3b3b55e62a1385d91d9985168973457134',
    network: passetHub.id,
  }
];