# TonAPI Incompatibilities

This document tracks known incompatibilities and differences between our standard `ApiClient` interface (which is historically based on Toncenter API) and the `ApiClientTonApi` implementation.

## 1. Historical State Queries (`seqno`)
- **Methods:** `getAccountState`, `getBalance`, `runGetMethod`
- **Issue:** The `seqno` parameter is not supported by TonApi's endpoints (e.g., `/v2/accounts/{address}`) for historical state queries. TonApi always executes against the current state of the blockchain.
- **Impact:** Any logic relying on fetching account state, balance, or running get methods at a specific past sequence number (`seqno`) will not work as expected. The `seqno` argument is essentially ignored in these methods.

## 2. Jetton Endpoints (`jettonsByAddress`, `jettonsByOwnerAddress`)
- **Methods:** `jettonsByAddress`, `jettonsByOwnerAddress`
- **Issue:** Toncenter supports `offset` and `limit` for pagination of user jettons. TonApi does not support pagination for these endpoints and returns all balances or fixed info. 
- **Impact:** The `offset` and `limit` arguments are ignored in `ApiClientTonApi`. For `jettonsByAddress`, TonApi returns a single jetton object, whereas Toncenter returns an array; we map it into an array of one item for compatibility, with mock values for unknown fields like `balance` (`'0'`) and transaction hashes. Also, `address_book` is returned as an empty object `{}` since TonApi jetton info does not provide this context.
- **Missing Properties (Jettons):** When mapping user jettons (`jettonsByOwnerAddress`), TonApi does not provide a `description` for jettons in the `/v2/accounts/{account_id}/jettons` response, so it is mapped as an empty string (`''`).
