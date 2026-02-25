# TonAPI Incompatibilities

This document tracks known incompatibilities and differences between our standard `ApiClient` interface (which is historically based on Toncenter API) and the `ApiClientTonApi` implementation.

## 1. Historical State Queries (`seqno`)
- **Methods:** `getAccountState`, `getBalance`, `runGetMethod`
- **Issue:** The `seqno` parameter is not supported by TonApi's endpoints (e.g., `/v2/accounts/{address}`) for historical state queries. TonApi always executes against the current state of the blockchain.
- **Impact:** Any logic relying on fetching account state, balance, or running get methods at a specific past sequence number (`seqno`) will not work as expected. The `seqno` argument is essentially ignored in these methods.

## 2. Jetton Endpoints (`jettonsByAddress`, `jettonsByOwnerAddress`)
- **Methods:** `jettonsByAddress`, `jettonsByOwnerAddress`
- **Issue:** Toncenter supports `offset` and `limit` for pagination of user jettons. TonApi does not support pagination for these endpoints and returns all balances or fixed info. 
- **Impact:** The `offset` and `limit` arguments are ignored in `ApiClientTonApi`. For `jettonsByAddress`, TonApi returns a single jetton object, whereas Toncenter returns an array; we map it into an array of one item for compatibility, with mock values for unknown fields like `balance` (`'0'`) and transaction hashes. For `jettonsByOwnerAddress` and `jettonsByAddress`, TonApi response structure usually embeds `address_book` equivalents directly into the wallet/owner objects, so we partially construct the resulting `JettonsResponse.addressBook` based on nested properties (`wallet_address.name`), leaving `interfaces` empty.
- **Missing Properties (Jettons):** When mapping user jettons (`jettonsByOwnerAddress`), TonApi does not provide a `description` for jettons in the `/v2/accounts/{account_id}/jettons` response, so it is mapped as an empty string (`''`).

- **Methods:** `nftItemsByAddress`, `nftItemsByOwner`
- **Issue:** `ApiClientToncenter` allows fetching NFT items without an address (returning a list of arbitrary NFTs). TonApi does not support this and requires an explicit address.
- **Impact:** Calling `nftItemsByAddress` without `request.address` will throw an error in `ApiClientTonApi`.
- **Missing Properties (addressBook):** In `ApiClientToncenter`, endpoints that return NFTs or Jets also populate a side-dictionary `address_book`, providing interface info (e.g. `is_wallet`) and domain resolution. TonApi's response structure usually embeds this directly into the owner object (e.g., `owner.is_wallet`, `owner.name`), so there is no separate global `address_book` dictionary. The mappers currently return an empty `addressBook: {}` or partially construct it based on returned nested properties.
