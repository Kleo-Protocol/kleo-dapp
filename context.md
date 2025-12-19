# Project Context – Polkadot DApp

## Tech Stack
- Frontend: Next.js + TypeScript
- Wallets: Polkadot.js Extension (browser)
- SDK: @polkadot/api
- Network: Polkadot / Kusama / Substrate-based chains
- Key Types: sr25519 / ed25519

## Architecture Principles
- Wallet logic is isolated in a wallet module
- No direct access to window.injected outside adapters
- All txs must:
  - Be signed by the user wallet
  - Be dry-run simulated when possible
  - Return structured results

## Security Rules
- Never store private keys
- Never auto-sign transactions
- Always request user consent via wallet
- Explicit network checks before tx submission

## Coding Style
- Strong typing (no `any`)
- Explicit error handling
- Async/await only
- Small, testable functions

## Polkadot Concepts Cursor Must Respect
- Accounts come from injected extensions
- API uses WebSocket providers
- Transactions require:
  - signer
  - account address
  - extrinsic