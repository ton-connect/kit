# TonAPI vs Toncenter

## `getAccountState`
- ❌ No historical state query (`seqno` ignored)

## `jettonsByAddress`
- ❌ No pagination (`limit`, `offset` ignored)
- ❌ No `total_supply`, `mintable`, `admin_address`, `jetton_content`, `jetton_wallet_code_hash`
- ❌ `code_hash`, `data_hash`, `last_transaction_lt` — empty stubs
- ❌ `address_book`: no `domain`, no `interfaces` for admin

## `jettonsByOwnerAddress`
- ❌ No pagination
- ❌ No `info.description` (empty string)
- ❌ `image.url` — cached proxy URL instead of original
- ✅ Extra: `decimalsNumber` field

## `nftItemsByAddress`
- ❌ Returns empty result on 404 (Toncenter returns empty array)
- ❌ No `codeHash`, `dataHash`

## `nftItemsByOwner`
- ❌ No `codeHash`, `dataHash` for items and collections

## `resolveDnsWallet`
- ✅ Better `.t.me` subdomain resolution than Toncenter

## Not implemented
- `sendBoc`
- `fetchEmulation`
- `runGetMethod`
- `getAccountTransactions`
- `getTransactionsByHash`
- `getPendingTransactions`
- `getTrace`
- `getPendingTrace`
- `getEvents`
