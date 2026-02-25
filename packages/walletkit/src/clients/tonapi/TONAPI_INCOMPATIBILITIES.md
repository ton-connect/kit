# TonAPI Incompatibilities

This document tracks known incompatibilities and differences between our standard `ApiClient` interface (which is historically based on Toncenter API) and the `ApiClientTonApi` implementation.

## 1. Historical State Queries (`seqno`)
- **Methods:** `getAccountState`, `getBalance`, `runGetMethod`
- **Issue:** The `seqno` parameter is not supported by TonApi's endpoints (e.g., `/v2/accounts/{address}`) for historical state queries. TonApi always executes against the current state of the blockchain.
- **Impact:** Any logic relying on fetching account state, balance, or running get methods at a specific past sequence number (`seqno`) will not work as expected. The `seqno` argument is essentially ignored in these methods.
