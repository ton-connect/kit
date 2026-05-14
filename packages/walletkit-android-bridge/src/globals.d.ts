/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Re-export bridge types for backwards compatibility
import type { AndroidBridgeType, WalletKitNativeBridgeType, WalletKitBridgeApi } from './types';

declare global {
    interface Window {
        walletkitBridge?: WalletKitBridgeApi;
        // WalletKitNative still hosts the synchronous host calls (storageGet/Set, sessionCreate,
        // apiSendBoc/RunGetMethod/GetBalance, …). The bidirectional bridge messaging that used
        // to live on `__walletkitCall` / `__walletkitResponse` now flows through a
        // WebMessagePort handed off from Kotlin during page load.
        WalletKitNative?: WalletKitNativeBridgeType;
        AndroidBridge?: AndroidBridgeType;
    }
}

export {};
