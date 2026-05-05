# TonAPI vs Toncenter

## `getAccountState`
- ❌ No historical state query (`seqno` ignored)

## `jettonsByAddress`
- ❌ No pagination (`limit`, `offset` ignored)
- ❌ `address_book`: no `domain`

## `jettonsByOwnerAddress`
- ❌ No pagination
- ❌ `image.url` — cached proxy URL instead of original

## `nftItemsByAddress`
- ❌ Returns empty result on 404 (Toncenter returns empty array)
- ❌ No `codeHash`, `dataHash`

## `nftItemsByOwner`
- ❌ No `codeHash`, `dataHash` for items and collections

## Not implemented
- `fetchEmulation`
