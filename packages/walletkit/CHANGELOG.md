# @ton/walletkit

## 0.0.4

### Patch Changes

-   Major API restructuring with new wallet interfaces and a Network object.
-   The `Network` object replaces the `CHAIN` enum (`Network.mainnet()`, `Network.testnet()`)
-   Added multi-network support
-   Refactored most models with field names updated to camelCase (e.g. `validUntil`, `extraCurrency`)
-   Added optional setting to disable automatic transaction emulation
-   Updated DefaultSignature to accept private key in both 32/64 bytes format
-   Rename signDataRequest to approveSignDataRequest for consistency
-   Update rejectSignDataRequest to properly respond with id
-   Add exports for CreateTonProofMessageBytes, ConvertTonProofMessage
-   Changed wallet key from walletAddress to walletId

## 0.0.3

### Patch Changes

-   Fix local transaction sending regression introduced in 0.0.2
