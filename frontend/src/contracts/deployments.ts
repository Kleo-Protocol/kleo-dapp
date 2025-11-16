import { ContractDeployment, passetHub } from 'typink';
import flipper from './artifacts/flipper/flipper.json';
import trustOracle from './artifacts/trust_oracle/trust_oracle.json';
import loanRegistry from './artifacts/loan_registry/loan_registry.json';
import loanInstance from './artifacts/loan_instance/loan_instance.json';

export enum ContractId {
  FLIPPER = 'flipper',
  TRUST_ORACLE = 'trust_oracle',
  LOAN_REGISTRY = 'loan_registry',
  LOAN_INSTANCE = 'loan_instance',
}

export const deployments: ContractDeployment[] = [
  {
    id: ContractId.FLIPPER,
    metadata: flipper,
    network: passetHub.id,
    address: '0xad70e3fa83a3d8340e87226c54f1ac6171cd0d85',
  },
  {
    id: ContractId.TRUST_ORACLE,
    metadata: trustOracle,
    address: '0xb129b9633d3855171dfd2a4e7b0b309f99cfb5c5',
    network: passetHub.id,
  },
  {
    id: ContractId.LOAN_REGISTRY,
    metadata: loanRegistry,
    address: '0x7eca749c9a303458a743fc019def1abf26d0e315',
    network: passetHub.id,
  },
  {
    id: ContractId.LOAN_INSTANCE,
    metadata: loanInstance,
    address: '0xc6d7f618aceb4189dfd7a2fb703efb3811b8ecf0',
    network: passetHub.id,
  },
];