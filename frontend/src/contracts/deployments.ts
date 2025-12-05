import { ContractDeployment, passetHub } from 'typink';
import flipper from './artifacts/flipper/flipper.json';
import trustOracle from './artifacts/trust_oracle/trust_oracle.json';
import loanRegistry from './artifacts/loan_registry/loan_registry.json';
import loanInstance from './artifacts/loan_instance/loan_instance.json';

export enum ContractId {
  TRUST_ORACLE = 'trust_oracle',
  LOAN_REGISTRY = 'loan_registry',
  LOAN_INSTANCE = 'loan_instance',
}

export const deployments: ContractDeployment[] = [
  {
    id: ContractId.TRUST_ORACLE,
    metadata: trustOracle,
    address: '0x899d7f073aa66fd8af651c82af99d7ec2677a997',
    network: passetHub.id,
  },
];