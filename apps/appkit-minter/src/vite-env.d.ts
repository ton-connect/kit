/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BRIDGE_URL?: string;
    readonly VITE_TON_API_KEY?: string;
    readonly VITE_TON_API_TESTNET_KEY?: string;
    readonly VITE_PRIVY_APP_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
