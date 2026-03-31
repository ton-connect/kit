---
name: ton-create-wallet
description: Create and deploy a TON agentic wallet. Use when the user wants to create a wallet, set up an agent wallet, deploy an agentic wallet, onboard a new wallet, or when any wallet operation fails because no wallet is configured. This skill is a prerequisite before sending, swapping, or managing assets.
user-invocable: true
disable-model-invocation: false
---

# Create TON Agentic Wallet

Deploy an on-chain agentic wallet on TON. The agent generates operator keys, opens the dashboard when local browser/shell tools are available, and uses callback-based completion only in long-lived stdio/HTTP MCP server sessions.

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

1. Call `agentic_start_root_wallet_setup` — this generates an operator key pair and returns a `setupId`, `dashboardUrl`, and `callbackUrl`
2. If the environment exposes local browser or shell tools, open `dashboardUrl` yourself with the platform opener (`open`, `xdg-open`, `start`) or browser automation; only paste the link to the user if automatic opening is unavailable or fails
3. Tell the user only to approve wallet deployment from their main TON wallet; do not ask them to retype the URL or copy intermediate data
4. In long-lived stdio/HTTP MCP server sessions, poll `agentic_get_root_wallet_setup` or `agentic_list_pending_root_wallet_setups` and wait for `status: "callback_received"` when callback flow is available; then call `agentic_complete_root_wallet_setup` with `setupId`;
5. In raw one-shot CLI usage, skip callback polling and ask for `walletAddress` after the user deploys the wallet; then call `agentic_complete_root_wallet_setup` with `walletAddress` 
6. Confirm the wallet is active with `get_current_wallet` or `list_wallets` (see `ton-manage-wallets` skill)

## How It Works

- The agent keeps the **operator private key** — it can sign transactions autonomously
- The user keeps the **owner key** — they can withdraw funds or revoke access at any time
- The wallet is an on-chain smart contract (NFT-based), not a custodial service
- The dashboard is at `agents.ton.org`

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `NETWORK` | `mainnet` (default) or `testnet` |
| `AGENTIC_CALLBACK_BASE_URL` | Public URL for the onboarding callback (auto in HTTP mode) |
| `AGENTIC_CALLBACK_PORT` | Port for the callback server |

## Notes

- Callback-driven completion is for long-lived stdio/HTTP MCP server sessions; raw CLI should use manual `walletAddress` completion
- If automatic dashboard opening is supported in the current environment, do it instead of asking the user to open the URL manually
- In raw CLI mode, ask for the wallet address after deployment because the callback server is not available long enough to complete the flow
- After wallet creation, fund the wallet with TON before using transfer or swap skills
