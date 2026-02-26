# TON Blockchain Wallet

Manage TON blockchain wallet operations including balance queries, transfers, swaps, NFTs, and DNS resolution.

## When to Use

Use this skill when the user wants to:
- Check wallet info, TON or token balances
- Send TON, Jettons (tokens), or NFTs
- Swap tokens on DEX
- View transaction history
- Resolve .ton domains

## Tools Available

### Wallet & Balance
- `get_wallet` - Get wallet address and network info
- `get_balance` - Get TON balance
- `get_jetton_balance` - Get specific token balance (needs `jettonAddress`)
- `get_jettons` - List all tokens in wallet
- `get_transactions` - View recent transactions (optional `limit`)
- `get_known_jettons` - Get list of popular tokens with addresses

### Transfers
- `send_ton` - Send TON (`toAddress`, `amount` in TON like "1.5", optional `comment`)
- `send_jetton` - Send tokens (`toAddress`, `jettonAddress`, `amount`, optional `comment`)
- `send_nft` - Transfer NFT (`nftAddress`, `toAddress`, optional `comment`)
- `send_raw_transaction` - Advanced: send raw transaction with multiple messages

### Swaps
- `get_swap_quote` - Get swap quote (`fromToken`, `toToken`, `amount` in human-readable format)
  - Use "TON" or jetton address for tokens
  - Returns transaction params for `send_raw_transaction`

### NFTs
- `get_nfts` - List wallet NFTs (optional `limit`, `offset`)
- `get_nft` - Get NFT details (`nftAddress`)

### DNS
- `resolve_dns` - Resolve .ton domain to address (`domain` like "foundation.ton")
- `back_resolve_dns` - Find domain for address (`address`)

## Common Workflows

### Check Balance
1. Call `get_wallet` for address and network
2. Call `get_balance` for TON
3. Call `get_jettons` for all tokens

### Send TON
1. If user provides .ton domain, call `resolve_dns` first
2. Call `send_ton` with address and amount
3. By default, poll `get_transaction_status` until status is completed or failed. User can ask to skip.

### Send Token
1. Call `get_jettons` to find token address and verify balance
2. Call `send_jetton` with token address and amount
3. By default, poll `get_transaction_status` until status is completed or failed. User can ask to skip.

### Swap Tokens
1. Call `get_known_jettons` if user mentions token by name
2. Call `get_swap_quote` to get quote and transaction params
3. Show quote to user and ask for confirmation
4. Call `send_raw_transaction` with the transaction params
5. By default, poll `get_transaction_status` until status is completed or failed. User can ask to skip.

## Notes

- Amounts for `send_ton`, `send_jetton`, and `get_swap_quote` are human-readable (e.g., "1.5" = 1.5 TON)
- Always confirm with user before executing transfers or swaps
- **Default flow:** After sending, poll `get_transaction_status` until completed or failed. User can specify whether to check status.
