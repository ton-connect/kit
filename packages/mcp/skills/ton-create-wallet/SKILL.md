---
name: ton-create-wallet
description: Create and deploy a TON agentic wallet. Use when the user wants to create a wallet, set up an agent wallet, deploy an agentic wallet, onboard a new wallet, or when any wallet operation fails because no wallet is configured. This skill is a prerequisite before sending, swapping, or managing assets.
user-invocable: true
disable-model-invocation: false
---

# Create TON Agentic Wallet

Deploy an on-chain agentic wallet on TON. The agent generates operator keys, the user deploys the wallet contract from the dashboard, then provides the wallet address to complete setup.

## MCP Tools

| Tool | Description |
| ---- | ----------- |
| `agentic_start_root_wallet_setup` | Generate operator keys, create pending setup, return dashboard URL |
| `agentic_list_pending_root_wallet_setups` | List pending setup drafts and their callback status |
| `agentic_get_root_wallet_setup` | Read one pending setup by `setupId` |
| `agentic_complete_root_wallet_setup` | Finish onboarding from callback or manual wallet address |
| `agentic_cancel_root_wallet_setup` | Cancel a pending setup |

### Tool Parameters

| Tool | Required | Optional |
| ---- | -------- | -------- |
| `agentic_start_root_wallet_setup` | — | `network`, `name`, `source`, `collectionAddress`, `tonDeposit` |
| `agentic_get_root_wallet_setup` | `setupId` | — |
| `agentic_complete_root_wallet_setup` | `setupId` | `walletAddress`, `ownerAddress` |
| `agentic_cancel_root_wallet_setup` | `setupId` | — |

## Workflow

1. Call `agentic_start_root_wallet_setup` — this generates an operator key pair and returns a `setupId` and `dashboardUrl`
2. Show the `dashboardUrl` to the user and tell them to open it, deploy the wallet from their TON wallet, and then come back with the deployed wallet address
3. **Ask the user for the wallet address** — in CLI/stdio mode there is no callback, so the agent must ask the user to paste the wallet address after they finish deployment on the dashboard
4. Call `agentic_complete_root_wallet_setup` with the `setupId` and the `walletAddress` provided by the user
5. Confirm the wallet is active with `get_current_wallet` or `list_wallets` (see `ton-manage-wallets` skill)

## How It Works

- The agent keeps the **operator private key** — it can sign transactions autonomously
- The user keeps the **owner key** — they can withdraw funds or revoke access at any time
- The wallet is an on-chain smart contract (NFT-based), not a custodial service
- The dashboard is at `agentic-wallets-dashboard.vercel.app`

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `NETWORK` | `mainnet` (default) or `testnet` |
| `AGENTIC_CALLBACK_BASE_URL` | Public URL for the onboarding callback (auto in HTTP mode) |
| `AGENTIC_CALLBACK_PORT` | Port for the callback server |

## Notes

- In CLI/stdio mode there is no callback — always ask the user for the wallet address after showing the dashboard URL
- Do **not** poll for callback status in CLI mode; just wait for the user to provide the address
- After wallet creation, fund the wallet with TON before using transfer or swap skills
