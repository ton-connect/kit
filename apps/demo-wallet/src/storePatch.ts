/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppState } from '@demo/core';

declare global {
    interface Window {
        __store: AppState;
    }
}

// Note: HMR for store is disabled when using WalletProvider
// The store is now managed by the provider and persisted automatically
// If you need to debug the store, use Redux DevTools (enabled by default)

if (import.meta.hot && typeof window !== 'undefined') {
    // Store current state for debugging
    import.meta.hot.accept();
}
