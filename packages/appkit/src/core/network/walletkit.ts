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

export { ApiClient, ApiClientToncenter, ApiClientTonApi } from '@ton/walletkit';
