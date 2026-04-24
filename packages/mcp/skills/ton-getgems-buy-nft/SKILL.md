---
name: ton-getgems-buy-nft
description: Buy NFTs on GetGems marketplace using the GetGems public API and TON MCP tools. Use when the user wants to buy an NFT on GetGems, purchase a collectible from GetGems, or mentions getgems.io in the context of buying NFTs.
user-invocable: true
disable-model-invocation: false
---

# Buy NFT on GetGems

Buy fixed-price NFTs from the [GetGems](https://getgems.io) marketplace. Authentication uses **TonProof** via the MCP `generate_ton_proof` tool, then GetGems API calls are made via `curl`, and the on-chain purchase uses existing MCP transaction tools.

> **API docs**: https://api.getgems.io/public-api/docs
> **Base URL**: `https://api.getgems.io/public-api`

## Step 1 — Authenticate with GetGems

1. Call `generate_ton_proof` with `domain` = `"getgems.io"`, `payload` = `"getgems-llm"`.
2. POST the proof to GetGems to obtain a temporary token (valid for 2 days):
   ```bash
   curl -s -X POST "https://api.getgems.io/public-api/auth/ton-proof" \
     -H "Content-Type: application/json" \
     -d '{
       "address": "<proof.address>",
       "chain": "<proof.chain>",
       "walletStateInit": "<proof.walletStateInit>",
       "publicKey": "<proof.publicKey>",
       "timestamp": <proof.timestamp>,
       "domainLengthBytes": <proof.domainLengthBytes>,
       "domainValue": "<proof.domainValue>",
       "signature": "<proof.signature>",
       "payload": "<proof.payload>",
       "authApplication": "TON MCP"
     }'
   ```
3. Response: `{ "token": "<TOKEN>" }`. Use this token as the `Authorization` header for subsequent API calls.
4. Cache the token for the session — it lasts 2 days.

> `authApplication` is a free-form identifier string (used by GetGems for analytics only). No registration is required — pick something that identifies the agent/app, e.g. `"TON MCP"`, `"ChatGPT 1.0"`, `"Claude via Cursor"`.

## Step 2 — Find the NFT

If the user already has the NFT address, skip to step 2b. If they only know a collection, start at 2a. If they want to browse/discover collections first, start at 2.0.

### 2.0. Discover collections (optional)

```bash
curl -s "https://api.getgems.io/public-api/v1/collections/top?kind=week&limit=50" \
  -H "Authorization: <TOKEN>"
```

`kind` is one of `day | week | month | all`. Returns `response.items[]` with:

- `collection.address` — use as `<collectionAddress>` in 2a.
- `collection.name`, `collection.description`, `collection.image`.
- `floorPrice` — **in whole TON** (a number, e.g. `0.41`). Do NOT confuse with `sale.fullPrice`, which is in **nanotons** (string).
- `place` — ranking position.

Sort client-side by `floorPrice` to find the cheapest collection that fits the user's budget.

### 2a. Browse NFTs on sale in a collection

```bash
curl -s "https://api.getgems.io/public-api/v1/nfts/on-sale/<collectionAddress>?limit=30" \
  -H "Authorization: <TOKEN>"
```

Returns `{ "success": true, "response": { "items": [...], "cursor": "..." } }`. Each item includes `address`, `name`, `image`, and a `sale` object with `fullPrice` in nanotons.

> **Important**: items are **not sorted by price**. To find the cheapest NFT, fetch a page (e.g. `limit=30`) and sort client-side by `sale.fullPrice`. For large collections, paginate with the `after` query parameter using the returned `cursor`.

Example (cheapest first):

```bash
curl -s "https://api.getgems.io/public-api/v1/nfts/on-sale/<collectionAddress>?limit=30" \
  -H "Authorization: <TOKEN>" \
| jq -r '.response.items
         | map(select(.sale.type == "FixPriceSale"))
         | sort_by(.sale.fullPrice | tonumber)
         | .[] | "\((.sale.fullPrice|tonumber)/1e9) TON  \(.name)  \(.address)"'
```

### 2b. Get NFT details

```bash
curl -s "https://api.getgems.io/public-api/v1/nft/<nftAddress>" \
  -H "Authorization: <TOKEN>"
```

Response contains `NftItemFull` with:
- `name`, `description`, `image` — display info
- `ownerAddress` — current owner
- `sale` — if present, the NFT is for sale. For fixed-price sales:
  - `sale.type` = `"FixPriceSale"`
  - `sale.fullPrice` — price in nanotons
  - `sale.currency` — price currency (`"TON"` etc.)
  - `sale.version` — **required** for the buy request
  - `sale.contractAddress` — the sale contract

If `sale` is absent, the NFT is not currently for sale.

## Step 3 — Build the buy transaction

```bash
curl -s -X POST "https://api.getgems.io/public-api/v1/nfts/buy-fix-price/<nftAddress>" \
  -H "Authorization: <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "version": "<sale.version>" }'
```

Response: `TransactionResponse`
```json
{
  "success": true,
  "response": {
    "uuid": "...",
    "from": "<buyer address or null>",
    "timeout": "<ISO-8601 UTC string, e.g. 2026-04-17T18:46:54.734Z>",
    "list": [
      {
        "to": "<destination address>",
        "amount": "<nanotons>",
        "payload": "<base64 BOC or null>",
        "stateInit": "<base64 BOC or null>"
      }
    ]
  }
}
```

Map `response.list` to MCP `messages` format and convert `response.timeout` (ISO-8601 string) to Unix seconds for `validUntil`.

> **Known errors from this endpoint (4xx):**
> - `DNS_WILL_SOON_OUTDATE` — the DNS item's on-chain expiry is too close; it cannot be bought. Skip and try the next cheapest listing. Common in `TON DNS Domains` and `Telegram Usernames` collections.
> - `401 Unauthorized` — token expired (2-day lifetime). Re-run Step 1.
> - Any other non-`success` — surface the error to the user and stop.

## Step 4 — Execute on-chain

| Action | Tool |
| ------ | ---- |
| Dry-run | `emulate_transaction` |
| Confirm + send | `send_raw_transaction` |
| Poll status | `get_transaction_status` |

1. Convert `response.timeout` (ISO string) to Unix seconds:
   ```bash
   VALID_UNTIL=$(date -u -d "2026-04-17T18:46:54.734Z" +%s)
   # portable fallback:
   # VALID_UNTIL=$(python3 -c "import datetime,sys;print(int(datetime.datetime.fromisoformat(sys.argv[1].replace('Z','+00:00')).timestamp()))" "$TIMEOUT")
   ```
2. Build the `messages` array from `response.list`, **omitting `null` `payload`/`stateInit` fields** (don't pass `"payload": null`):
   ```bash
   MESSAGES=$(echo "$BUY_RESPONSE" | jq -c '
     [ .response.list[]
       | { address: .to, amount, payload, stateInit }
       | with_entries(select(.value != null)) ]')
   ```
3. `emulate_transaction` with the mapped `messages` and `validUntil`:
   ```bash
   node dist/cli.js emulate_transaction --messages "$MESSAGES" --validUntil "$VALID_UNTIL"
   ```
   Resulting payload shape:
   ```json
   {
     "messages": [
       {
         "address": "<list[].to>",
         "amount": "<list[].amount>",
         "payload": "<base64 BOC>"
       }
     ],
     "validUntil": 1776451614
   }
   ```
4. Show the user: NFT name, collection, price in TON (divide `sale.fullPrice` by 1e9), amount sent (`list[].amount` — larger than price; see note below), and emulation results.
5. Confirm once with the user before proceeding.
6. `send_raw_transaction` with the same `messages` and `validUntil`.
7. Poll `get_transaction_status` with the returned `normalizedHash` until `completed` or `failed`.

> **Budget / gas headroom**: `list[].amount` is **higher than** `sale.fullPrice` — it prepays gas for the sale contract, which refunds unused TON. Make sure the wallet holds at least `sum(list[].amount) + ~0.05 TON` (for external-message fees). The emulation result's `moneyFlow.ourTransfers[].amount` shows the real net cost after change.

> **Timeout is short**: `response.timeout` is typically ~2 minutes from the build call. If more than ~90 seconds pass between building the buy transaction and `send_raw_transaction` (e.g. waiting on user confirmation), re-run Step 3 to get fresh `messages` and `timeout`.

## MCP Tools

| Tool | Required | Optional |
| ---- | -------- | -------- |
| `generate_ton_proof` | `domain`, `payload` | `walletSelector` |
| `emulate_transaction` | `messages` | `validUntil` |
| `send_raw_transaction` | `messages` | `validUntil`, `walletSelector` |
| `get_transaction_status` | `normalizedHash` | — |

## CLI argument names (exact)

| Tool | Arg | CLI flag |
| ---- | --- | -------- |
| `generate_ton_proof` | domain | `--domain` |
| `generate_ton_proof` | payload | `--payload` |
| `emulate_transaction` | messages | `--messages` (JSON array) |
| `emulate_transaction` | validUntil | `--validUntil` |
| `send_raw_transaction` | messages | `--messages` (JSON array) |
| `send_raw_transaction` | validUntil | `--validUntil` |
| `get_transaction_status` | normalizedHash | `--normalizedHash` |

## Notes

- Always confirm with the user before executing `send_raw_transaction` — show NFT name, price, and emulation results.
- If the NFT is not on sale (`sale` field is absent), inform the user and do not proceed.
- The GetGems token expires after 2 days. If a request returns 401, re-authenticate.
- Alternatively, the user can obtain a permanent API key at https://getgems.io/public-api and pass it directly as the `Authorization` header, skipping the TonProof flow.
- `authApplication` is a free-form identification string used by GetGems for analytics. No registration required — use something that identifies the agent/app (e.g. `"TON MCP"`, `"ChatGPT 1.0"`, `"Claude via Cursor"`).
- Unit conventions that are easy to confuse:
  - `floorPrice` (from `/v1/collections/top`) — **whole TON as a number**.
  - `sale.fullPrice`, `sale.marketplaceFee`, `list[].amount` — **nanotons as a string** (divide by 1e9 for TON).
  - `response.timeout` (from `/v1/nfts/buy-fix-price/...`) — **ISO-8601 UTC string**, convert to Unix seconds for `validUntil`.

## Relations

- Wallet setup: **`ton-create-wallet`** skill.
- Balance checks: **`ton-balance`** skill.
- NFT operations (view, send, list owned): **`ton-nfts`** skill.
