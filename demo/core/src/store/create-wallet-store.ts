/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { setWalletKitConfig } from './utils/config';
import { createLogger } from './utils/logger';
import type { StoreLogger } from './utils/logger';
import { isStoreInitialized, setStore } from './utils/store-instance';
import { createAuthSlice } from './slices/auth/slice';
import { createWalletCoreSlice } from './slices/wallet-core/slice';
import { createTonConnectSlice } from './slices/ton-connect/slice';
import { createJettonsSlice } from './slices/jettons/slice';
import { createNftsSlice } from './slices/nfts/slice';
import { createWalletManagementSlice } from './slices/wallet-management/slice';
import type { AppState } from '../types/store';
import type { StorageAdapter } from '../adapters/storage/types';
import type { WalletKitConfig } from '../types/wallet';
import { initializeWalletKit } from './slices/wallet-core/actions';
import { clearExpiredRequests, processNextRequest } from './slices/ton-connect/actions';

export interface CreateWalletStoreOptions {
    /**
     * Storage adapter for persisting wallet data
     * Use LocalStorageAdapter for web, AsyncStorageAdapter for React Native
     */
    storage?: StorageAdapter;

    /**
     * Enable Redux DevTools
     */
    enableDevtools?: boolean;

    /**
     * Custom logger function
     */
    logger?: StoreLogger;

    walletKitConfig?: WalletKitConfig;
}

/**
 * Creates a Zustand store for wallet management
 */
export function createWalletStore(options: CreateWalletStoreOptions = {}) {
    const { storage, enableDevtools = true, logger: customLogger, walletKitConfig } = options;

    const log = createLogger(customLogger);

    const store = create<AppState>()(
        devtools(
            subscribeWithSelector(
                persist(
                    immer((...a) => ({
                        isHydrated: false,
                        auth: createAuthSlice(...a),
                        jettons: createJettonsSlice(...a),
                        nfts: createNftsSlice(...a),
                        walletCore: createWalletCoreSlice(...a),
                        walletManagement: createWalletManagementSlice(...a),
                        tonConnect: createTonConnectSlice(...a),
                    })),
                    {
                        name: 'demo-wallet-store',
                        storage: storage ? createJSONStorage(() => storage) : createJSONStorage(() => localStorage),
                        partialize: (state) => ({
                            auth: {
                                isPasswordSet: state.auth.isPasswordSet,
                                passwordHash: state.auth.passwordHash,
                                persistPassword: state.auth.persistPassword,
                                holdToSign: state.auth.holdToSign,
                                useWalletInterfaceType: state.auth.useWalletInterfaceType,
                                ledgerAccountNumber: state.auth.ledgerAccountNumber,
                                ...(state.auth.persistPassword && {
                                    currentPassword: state.auth.currentPassword,
                                }),
                            },
                            walletManagement: {
                                hasWallet: state.walletManagement.hasWallet,
                                savedWallets: state.walletManagement.savedWallets,
                                activeWalletId: state.walletManagement.activeWalletId,
                            },
                            tonConnect: {
                                requestQueue: state.tonConnect.requestQueue,
                                isSignDataModalOpen: state.tonConnect.isSignDataModalOpen,
                                isTransactionModalOpen: state.tonConnect.isTransactionModalOpen,
                                isConnectModalOpen: state.tonConnect.isConnectModalOpen,
                                pendingSignDataRequest: state.tonConnect.pendingSignDataRequest,
                                pendingTransactionRequest: state.tonConnect.pendingTransactionRequest,
                                pendingConnectRequest: state.tonConnect.pendingConnectRequest,
                            },
                        }),
                        merge: (persistedState, currentState) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const persisted = persistedState as any;

                            const merged = {
                                ...currentState,
                                auth: {
                                    ...currentState.auth,
                                    ...persisted?.auth,
                                    isUnlocked:
                                        persisted?.auth?.persistPassword &&
                                        persisted?.auth?.currentPassword &&
                                        persisted?.auth?.isPasswordSet,
                                },
                                walletManagement: {
                                    ...currentState.walletManagement,
                                    savedWallets: persisted?.walletManagement?.savedWallets || [],
                                    activeWalletId: persisted?.walletManagement?.activeWalletId,
                                    hasWallet: (persisted?.walletManagement?.savedWallets?.length || 0) > 0,
                                    transactions: [],
                                },
                                tonConnect: {
                                    ...currentState.tonConnect,
                                    ...persisted?.tonConnect,
                                    disconnectedSessions: [],
                                    requestQueue: persisted?.tonConnect?.requestQueue || {
                                        items: [],
                                        currentRequestId: undefined,
                                        isProcessing: false,
                                    },
                                },
                            };

                            return merged as AppState;
                        },
                        onRehydrateStorage: () => (state, error) => {
                            if (error) {
                                log.error('Store rehydration error:', error);
                                return;
                            }

                            if (!state) {
                                return;
                            }

                            log.info('Store rehydrated successfully');

                            // Set hydration flag
                            state.isHydrated = true;

                            // Call actions after rehydration
                            if (isStoreInitialized()) {
                                void clearExpiredRequests();
                            }

                            // Resume processing if there are queued requests
                            if (
                                state.tonConnect.requestQueue.items.length > 0 &&
                                !state.tonConnect.requestQueue.isProcessing
                            ) {
                                log.info('Resuming queue processing after rehydration');
                                processNextRequest();
                            }
                        },
                    },
                ),
            ),
            {
                enabled: enableDevtools,
                serialize: {
                    replacer: (_: unknown, value: unknown) => (typeof value === 'bigint' ? '' : value),
                },
            },
        ),
    );

    setStore(store);
    setWalletKitConfig(walletKitConfig);

    void initializeWalletKit();

    return store;
}
