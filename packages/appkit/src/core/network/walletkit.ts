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
 * Walletkit-side network manager that {@link AppKitNetworkManager} extends, adding default-network state and AppKit event emission. Apps usually interact with the {@link AppKitNetworkManager} subclass.
 *
 * @extract
 * @public
 * @category Class
 * @section Networks
 */
export { KitNetworkManager } from '@ton/walletkit';

/**
 * Indexer/RPC client interface used by AppKit to read on-chain state — balance, jettons, NFTs, etc. Each {@link Network} resolves to its own `ApiClient` via {@link AppKitNetworkManager}. Apps usually pull one through {@link getApiClient} rather than constructing it directly.
 *
 * @extract
 * @public
 * @category Type
 * @section Client
 */
export { ApiClient } from '@ton/walletkit';

/**
 * {@link ApiClient} implementation backed by the Toncenter API.
 *
 * @extract
 * @public
 * @category Class
 * @section Client
 */
export { ApiClientToncenter } from '@ton/walletkit';

/**
 * Configuration accepted by {@link ApiClientToncenter} — endpoint, API key, request timeout, custom `fetch`, target network, and optional DNS-resolver override.
 *
 * @extract
 * @public
 * @category Type
 * @section Client
 */
export type { ApiClientToncenterConfig } from '@ton/walletkit';

/**
 * {@link ApiClient} implementation backed by the TonAPI indexer.
 *
 * @extract
 * @public
 * @category Class
 * @section Client
 */
export { ApiClientTonApi } from '@ton/walletkit';

/**
 * Configuration shared by every {@link ApiClient} subclass — endpoint, API key, request timeout, custom `fetch`, target network and a `disableNetworkSend` dev toggle. Accepted directly by {@link ApiClientTonApi}; extended by {@link ApiClientToncenterConfig}.
 *
 * @extract
 * @public
 * @category Type
 * @section Client
 */
export type { BaseApiClientConfig } from '@ton/walletkit';
