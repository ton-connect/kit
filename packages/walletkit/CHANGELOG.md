# @ton/walletkit

## 0.0.6

### Patch Changes

### Added

-   Custom `SessionManager` injection support via WalletKit options
-   Custom `ApiClient` implementation support for iOS/Android bridges
-   Session storage versioning with migration support for future releases

### Changed

-   Replace `bip39` with lightweight `@scure/bip39`

### Removed

-   `@truecarry/tlb-abi` dependency
-   `tlb-runtime` dependency (SignData Cell preview temporarily unavailable)

### Breaking

-   Existing sessions will be invalidated due to storage format changes
-   Approval API for connect/transaction/sign requests now accepts prepared results via second argument

## 0.0.5

### Patch Changes

-   Update WalletKit to use Network object instead of CHAIN constants
-   Generate README.md samples from real example files
-   Remove function exports from types (SendModeFromValue, SendModeToValue, asHex)

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
