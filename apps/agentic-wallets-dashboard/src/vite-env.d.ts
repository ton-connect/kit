/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TON_API_KEY?: string;
    readonly VITE_TON_API_TESTNET_KEY?: string;
    readonly VITE_TON_API_MIN_REQUEST_INTERVAL_MS?: string;
    readonly VITE_AGENTIC_COLLECTION_MAINNET?: string;
    readonly VITE_AGENTIC_COLLECTION_TESTNET?: string;
    readonly VITE_AGENTIC_WALLET_CODE_BOC?: string;
    readonly VITE_AGENTIC_OWNER_OP_GAS?: string;
    readonly VITE_AGENTIC_ACTIVITY_POLL_MS?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
