/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Main app store with combined slices
export * from './appStore';

// Export main store
export { useStore } from './appStore';

// Individual slice creators
export { createAuthSlice } from './slices/authSlice';
export { createWalletCoreSlice } from './slices/walletCoreSlice';
export { createWalletManagementSlice } from './slices/walletManagementSlice';
export { createTonConnectSlice } from './slices/tonConnectSlice';
export { createJettonsSlice } from './slices/jettonsSlice';
export { createNftsSlice } from './slices/nftsSlice';

// Types
export type {
    AppState,
    AuthSlice,
    WalletCoreSlice,
    WalletManagementSlice,
    TonConnectSlice,
    JettonsSlice,
    NftsSlice,
} from '../types/store';
