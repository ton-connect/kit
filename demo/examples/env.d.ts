/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WALLET_MNEMONIC: string;
    readonly VITE_TON_API_KEY_MAINNET: string;
    readonly VITE_TON_API_KEY_TESTNET: string;
    readonly VITE_BRIDGE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
