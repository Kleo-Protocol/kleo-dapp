import { ContractDeployment, passetHub } from 'typink';
import flipper from './artifacts/flipper/flipper.json';

export enum ContractId {
  FLIPPER = 'flipper',
}

export const deployments: ContractDeployment[] = [
  {
    id: ContractId.FLIPPER,
    metadata: flipper,
    network: passetHub.id,
    address: '0xad70e3fa83a3d8340e87226c54f1ac6171cd0d85',
  },
];
