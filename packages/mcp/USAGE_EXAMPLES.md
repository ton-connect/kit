# Usage Examples

These examples show how `@ton/mcp` can be used in raw CLI mode. They are illustrative rather than literal agent logs: each example includes a representative user request, the `npx @ton/mcp@alpha` commands an agent would typically run, and the kind of response it would usually return.

## Agentic Wallets

### Create an agentic wallet

**User request**

`Create an agentic wallet`

**Approximate command list**

```bash
npx @ton/mcp@alpha agentic_start_root_wallet_setup --name "My Agent" --network mainnet
open <DASHBOARD_URL>
npx @ton/mcp@alpha agentic_complete_root_wallet_setup --setupId <SETUP_ID> --walletAddress <WALLET_ADDRESS>
npx @ton/mcp@alpha get_current_wallet
```

**Approximate agent response**

> A new agentic wallet setup was started, and the dashboard link was opened. After the dashboard step was completed, wallet `EQ...` was added and set as the active wallet.

### Import an existing agentic wallet

**User request**

`Import my existing agentic wallet EQ...`

**Approximate command list**

```bash
npx @ton/mcp@alpha agentic_validate_wallet --address EQ...
npx @ton/mcp@alpha agentic_import_wallet --address EQ... --name "Imported wallet"
npx @ton/mcp@alpha agentic_rotate_operator_key --walletSelector "Imported wallet"
open <DASHBOARD_URL>
npx @ton/mcp@alpha list_wallets
```

**Approximate agent response**

> Wallet `EQ...` was validated and imported into the local registry under the name `Imported wallet`. The dashboard link for the `Public Key` update was opened. Until that on-chain confirmation is completed, the wallet is available in read-only mode.

### Rotate the operator key

**User request**

`Rotate the operator key for the active agentic wallet`

**Approximate command list**

```bash
npx @ton/mcp@alpha agentic_rotate_operator_key
open <DASHBOARD_URL>
npx @ton/mcp@alpha agentic_get_pending_operator_key_rotation --rotationId <ROTATION_ID>
npx @ton/mcp@alpha agentic_complete_rotate_operator_key --rotationId <ROTATION_ID>
```

**Approximate agent response**

> The dashboard link for the `Public Key` update was opened. After the main wallet confirms the change, write access is restored.

### List agentic wallets by owner

**User request**

`Which agentic wallets belong to owner address EQ...?`

**Approximate command list**

```bash
npx @ton/mcp@alpha agentic_list_wallets_by_owner --ownerAddress EQ...
```

**Approximate agent response**

> Several agentic wallets were found for owner address `EQ...`. For each wallet, the agent typically shows the wallet address and basic metadata.

## Wallet Registry and Balances

### List wallets in the registry

**User request**

`Which wallets do I have?`

**Approximate command list**

```bash
npx @ton/mcp@alpha list_wallets
npx @ton/mcp@alpha get_current_wallet
```

**Approximate agent response**

> Several wallets were found. The active wallet is `EQ...`. The others can be selected by `id`, name, or address via `set_active_wallet`.

### Switch the active wallet

**User request**

`Make wallet "treasury" active`

**Approximate command list**

```bash
npx @ton/mcp@alpha set_active_wallet --walletSelector treasury
npx @ton/mcp@alpha get_current_wallet
```

**Approximate agent response**

> The active wallet was switched to `treasury`. Current address: `UQ...`. Network: `mainnet`.

### Show the active wallet balance

**User request**

`Show my balance in TON and jettons`

**Approximate command list**

```bash
npx @ton/mcp@alpha get_balance
npx @ton/mcp@alpha get_jettons
```

**Approximate agent response**

> Active wallet balance: `12.84 TON`. Jetton balances include `USDT 53.2`, `NOT 1400`, and `STON 18.05`.

### Show the balance of any address

**User request**

`Show the balance of address EQ...`

**Approximate command list**

```bash
npx @ton/mcp@alpha get_balance_by_address --address EQ...
npx @ton/mcp@alpha get_jettons_by_address --address EQ...
```

**Approximate agent response**

> Address `EQ...` has a balance of `3.21 TON`. No jettons were found for that address.

### Find a known jetton address

**User request**

`Show the address of USDT`

**Approximate command list**

```bash
npx @ton/mcp@alpha get_known_jettons
```

**Approximate agent response**

> `USDT` was found in the list of known jettons with master contract address `EQ...`. That address can be used with `send_jetton` or `get_swap_quote`.

## Transfers and Swaps

### Send TON to a TON DNS name

**User request**

`Send 1 TON to foundation.ton`

**Approximate command list**

```bash
npx @ton/mcp@alpha resolve_dns --domain foundation.ton
npx @ton/mcp@alpha send_ton --toAddress EQ... --amount 1
npx @ton/mcp@alpha get_transaction_status --normalizedHash <NORMALIZED_HASH>
```

**Approximate agent response**

> `foundation.ton` was resolved to TON address `EQ...`. The `1 TON` transfer was sent with `normalizedHash: <NORMALIZED_HASH>`. Transaction status: `completed`.

### Send a jetton

**User request**

`Send 25 USDT to UQAbc...`

**Approximate command list**

```bash
npx @ton/mcp@alpha get_jettons
npx @ton/mcp@alpha send_jetton --jettonAddress EQ... --toAddress UQAbc... --amount 25
npx @ton/mcp@alpha get_transaction_status --normalizedHash <NORMALIZED_HASH>
```

**Approximate agent response**

> `USDT` was found in the wallet, and the `25 USDT` transfer to `UQAbc...` was sent. `normalizedHash: <NORMALIZED_HASH>`. Current status: `completed`.

### Swap TON for a jetton

**User request**

`Swap 2 TON to USDT`

**Approximate command list**

```bash
npx @ton/mcp@alpha get_known_jettons
# quote
npx @ton/mcp@alpha get_swap_quote --fromToken TON --toToken EQ... --amount 2 --slippageBps 100
# pass messages from quote if user approved
npx @ton/mcp@alpha send_raw_transaction --messages '<quote.transaction.messages>'
# If the quote includes transaction.validUntil, add --validUntil to the send_raw_transaction invocation above
npx @ton/mcp@alpha get_transaction_status --normalizedHash <NORMALIZED_HASH>
```

**Approximate agent response**

> A quote was received for swapping `2 TON` to `USDT`. After confirmation, the swap was executed with an expected output of about `X USDT` after slippage. `normalizedHash: <NORMALIZED_HASH>`.

### Show recent transactions

**User request**

`Show my last 5 transactions`

**Approximate command list**

```bash
npx @ton/mcp@alpha get_transactions --limit 5
```

**Approximate agent response**

> The last 5 operations were shown, including incoming and outgoing TON transfers, jetton transfers, and swaps. For each transaction, the agent typically shows the time, action type, amount, and final status.

## TON DNS

### Resolve a TON DNS name

**User request**

`What does foundation.ton resolve to?`

**Approximate command list**

```bash
npx @ton/mcp@alpha resolve_dns --domain foundation.ton
```

**Approximate agent response**

> Domain `foundation.ton` resolves to address `EQ...`.

### Reverse-resolve an address

**User request**

`Does address EQ... have a TON DNS name?`

**Approximate command list**

```bash
npx @ton/mcp@alpha back_resolve_dns --address EQ...
```

**Approximate agent response**

> If reverse resolution succeeds, address `EQ...` maps to a DNS name such as `foundation.ton`. Otherwise, the agent reports that no DNS name was found.

## NFTs

### List NFTs in the active wallet

**User request**

`Show my NFTs`

**Approximate command list**

```bash
npx @ton/mcp@alpha get_nfts --limit 20
```

**Approximate agent response**

> A list of NFTs from the active wallet was shown, including addresses, collection names, preview metadata, and key attributes.

### Show NFT details

**User request**

`Show details for NFT EQ...`

**Approximate command list**

```bash
npx @ton/mcp@alpha get_nft --nftAddress EQ...
```

**Approximate agent response**

> For NFT `EQ...`, the agent shows metadata, collection information, owner, content URI, and attributes.

### Send an NFT

**User request**

`Send NFT EQ... to UQReceiver...`

**Approximate command list**

```bash
npx @ton/mcp@alpha send_nft --nftAddress EQ... --toAddress UQReceiver...
npx @ton/mcp@alpha get_transaction_status --normalizedHash <NORMALIZED_HASH>
```

**Approximate agent response**

> NFT `EQ...` was sent to `UQReceiver...`. `normalizedHash: <NORMALIZED_HASH>`. Transaction status: `completed`.

### Show NFTs owned by any address

**User request**

`Show NFTs owned by address EQ...`

**Approximate command list**

```bash
npx @ton/mcp@alpha get_nfts_by_address --address EQ... --limit 10
```

**Approximate agent response**

> NFTs owned by address `EQ...` were shown, even though that address is not one of the saved wallets.
