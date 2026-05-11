---
'@ton/walletkit': patch
'@ton/appkit': patch
'@ton/mcp': patch
---

Added emulation support to the TonAPI client and introduced provider-agnostic emulation domain models under `api/models/emulation` (`EmulationResult`, `EmulationResponse`, `EmulationTransaction`, `EmulationMessage`, `EmulationAction`, `EmulationTraceNode`, `EmulationAddressBookEntry`). `ApiClient.fetchEmulation` now returns `EmulationResult` instead of the toncenter-specific `ToncenterEmulationResult`, so callers get the same shape regardless of backend. Reorganized toncenter raw types under `clients/toncenter/types/*` (NFTs, jettons, DNS, metadata, raw emulation), moved the `ApiClient` interface to `api/interfaces`, removed legacy emulation parsing utilities (`utils/toncenterEmulation`, message/jetton parser handlers), and migrated optional NFT and DNS results from `null` to `undefined` across walletkit, appkit, and mcp.
