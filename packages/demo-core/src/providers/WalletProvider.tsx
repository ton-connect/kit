/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { createContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { StoreApi } from 'zustand';

import { createWalletStore } from '../store/createWalletStore';
import type { CreateWalletStoreOptions } from '../store/createWalletStore';
import type { AppState } from '../types/store';

export const WalletStoreContext = createContext<StoreApi<AppState> | null>(null);

export interface WalletProviderProps extends CreateWalletStoreOptions {
    children: ReactNode;
}

/**
 * Provider component for wallet state management
 *
 * @example
 * ```typescript
 * import { WalletProvider } from '@ton/demo-core';
 *
 * function App() {
 *   return (
 *     <WalletProvider network="testnet">
 *       <YourApp />
 *     </WalletProvider>
 *   );
 * }
 * ```
 */
export function WalletProvider({ children, ...options }: WalletProviderProps) {
    const store = useMemo(
        () => createWalletStore(options),
        [options.storage, options.enableDevtools, options.walletKitConfig],
    );

    return <WalletStoreContext.Provider value={store}>{children}</WalletStoreContext.Provider>;
}
