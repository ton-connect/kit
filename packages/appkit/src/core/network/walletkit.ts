/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Re-export of walletkit network primitives. Kept in a leaf file so internal
// modules (`./services/...`) can import without forming a cycle through `./index.ts`.

/**
 * Walletkit-side network manager — the base class {@link AppKitNetworkManager} extends with default-network state and AppKit event emission. Apps usually interact with the {@link AppKitNetworkManager} subclass via {@link AppKit}`.networkManager`.
 *
 * @extract
 * @public
 * @category Class
 * @section Networks
 */
export { KitNetworkManager } from '@ton/walletkit';

/**
 * Indexer/RPC client interface used by AppKit to read on-chain state — balance, jettons, NFTs, masterchain seqno, etc. Each {@link Network} resolves to its own `ApiClient` via {@link AppKitNetworkManager}; apps usually pull one through {@link getApiClient} rather than constructing it directly.
 *
 * @extract
 * @public
 * @category Type
 * @section Networks
 */
export { ApiClient } from '@ton/walletkit';

export { ApiClientToncenter, ApiClientTonApi } from '@ton/walletkit';
