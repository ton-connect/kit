/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Re-export bridge types for backwards compatibility
import type {
    AndroidBridgeType,
    WalletKitNativeBridgeType,
    WalletKitBridgeApi,
    WalletKitApiMethod,
} from './types';

declare global {
    interface Window {
        walletkitBridge?: WalletKitBridgeApi;
        __walletkitCall?: (id: string, method: WalletKitApiMethod, paramsJson?: string | null) => void;
        __walletkitResponse?: (id: string, resultJson?: string | null, errorJson?: string | null) => void;
        WalletKitNative?: WalletKitNativeBridgeType;
        AndroidBridge?: AndroidBridgeType;
    }
}

export {};
