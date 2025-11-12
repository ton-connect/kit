/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletKitBridgeApi } from './types';
import { api } from './api';
import { setBridgeApi, registerNativeCallHandler } from './transport/messaging';
import { debugLog } from './utils/logger';

declare global {
    interface Window {
        walletkitBridge?: WalletKitBridgeApi;
    }
}

setBridgeApi(api as WalletKitBridgeApi);
registerNativeCallHandler();

window.walletkitBridge = api;
debugLog('[walletkitBridge] bootstrap complete');

export { api };
export type { WalletKitBridgeApi } from './types';
