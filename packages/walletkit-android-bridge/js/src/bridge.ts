/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import type { WalletKitBridgeApi } from './types';
import { api } from './api';
import { setBridgeApi, registerNativeCallHandler } from './transport/messaging';
import { postToNative } from './transport/nativeBridge';
import { currentNetwork, currentApiBase } from './core/state';

declare global {
    interface Window {
        walletkitBridge?: WalletKitBridgeApi;
    }
}

setBridgeApi(api as WalletKitBridgeApi);
registerNativeCallHandler();

window.walletkitBridge = api;

postToNative({
    kind: 'ready',
    network: currentNetwork,
    tonApiUrl: currentApiBase,
});
console.log('[walletkitBridge] bootstrap complete');

export { api };
export type { WalletKitBridgeApi } from './types';
