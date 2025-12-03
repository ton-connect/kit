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

import { createAuthSlice } from './slices/authSlice';
import { createWalletCoreSlice } from './slices/walletCoreSlice';
import { createWalletManagementSlice } from './slices/walletManagementSlice';
import { createTonConnectSlice } from './slices/tonConnectSlice';
import { createJettonsSlice } from './slices/jettonsSlice';
import { createNftsSlice } from './slices/nftsSlice';
import type { AppState } from '../types/store';
import type { StorageAdapter } from '../adapters/storage/types';
import type { WalletKitConfig } from '../types/wallet';

const STORE_VERSION = 2;

export interface CreateWalletStoreOptions {
    /**
     * Storage adapter for persisting wallet data
     * Use LocalStorageAdapter for web, AsyncStorageAdapter for React Native
     */
    storage?: StorageAdapter;

    /**
     * Network to use (mainnet or testnet)
     */
    defaultNetwork?: 'mainnet' | 'testnet';

    /**
     * Enable Redux DevTools
     */
    enableDevtools?: boolean;

    /**
     * Custom logger function
     */
    logger?: {
        info: (...args: unknown[]) => void;
        warn: (...args: unknown[]) => void;
        error: (...args: unknown[]) => void;
    };

    walletKitConfig?: WalletKitConfig;
}

const createLogger = (customLogger?: CreateWalletStoreOptions['logger']) => {
    if (customLogger) return customLogger;

    return {
        // eslint-disable-next-line no-console
        info: (...args: unknown[]) => console.log('[WalletStore]', ...args),
        // eslint-disable-next-line no-console
        warn: (...args: unknown[]) => console.warn('[WalletStore]', ...args),
        // eslint-disable-next-line no-console
        error: (...args: unknown[]) => console.error('[WalletStore]', ...args),
    };
};

const migrate = (persistedState: unknown, fromVersion: number, log: ReturnType<typeof createLogger>): unknown => {
    log.info('Migrating store from version', fromVersion, 'to', STORE_VERSION);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let state = persistedState as Record<string, any>;

    // Migration from v1 (old wallet slice) to v2 (split slices)
    if (fromVersion < 2) {
        // Move wallet state to walletManagement
        const walletState = state.wallet || {};

        state = {
            auth: state.auth || {},
            walletCore: {
                walletKit: null,
                walletKitInitializer: null,
            },
            walletManagement: {
                savedWallets: walletState.savedWallets || [],
                activeWalletId: walletState.activeWalletId,
                hasWallet: walletState.hasWallet || false,
                isAuthenticated: false,
                events: [],
            },
            tonConnect: {
                requestQueue: walletState.requestQueue || {
                    items: [],
                    currentRequestId: undefined,
                    isProcessing: false,
                },
                pendingConnectRequest: walletState.pendingConnectRequest,
                isConnectModalOpen: walletState.isConnectModalOpen || false,
                pendingTransactionRequest: walletState.pendingTransactionRequest,
                isTransactionModalOpen: walletState.isTransactionModalOpen || false,
                pendingSignDataRequest: walletState.pendingSignDataRequest,
                isSignDataModalOpen: walletState.isSignDataModalOpen || false,
                disconnectedSessions: walletState.disconnectedSessions || [],
            },
            jettons: state.jettons,
            nfts: state.nfts,
        };
    }

    return state;
};

/**
 * Creates a Zustand store for wallet management
 */
export function createWalletStore(options: CreateWalletStoreOptions = {}) {
    const {
        storage,
        defaultNetwork = 'testnet',
        enableDevtools = true,
        logger: customLogger,
        walletKitConfig,
    } = options;

    const log = createLogger(customLogger);

    const store = create<AppState>()(
        devtools(
            subscribeWithSelector(
                persist(
                    immer((...a) => ({
                        isHydrated: false,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        ...createAuthSlice(...a),
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        ...createWalletCoreSlice(walletKitConfig)(...a),
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        ...createWalletManagementSlice(...a),
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        ...createTonConnectSlice(...a),
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        ...createJettonsSlice(...a),
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        ...createNftsSlice(...a),
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    })) as unknown as any,
                    {
                        name: 'demo-wallet-store',
                        storage: storage ? createJSONStorage(() => storage) : createJSONStorage(() => localStorage),
                        version: STORE_VERSION,
                        migrate: (persistedState, fromVersion) => migrate(persistedState, fromVersion, log),
                        partialize: (state) => ({
                            auth: {
                                isPasswordSet: state.auth.isPasswordSet,
                                passwordHash: state.auth.passwordHash,
                                persistPassword: state.auth.persistPassword,
                                holdToSign: state.auth.holdToSign,
                                useWalletInterfaceType: state.auth.useWalletInterfaceType,
                                ledgerAccountNumber: state.auth.ledgerAccountNumber,
                                network: state.auth.network,
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
                                    network: persisted?.auth?.network || defaultNetwork,
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
                            if (state.clearExpiredRequests) {
                                state.clearExpiredRequests();
                            }

                            // Resume processing if there are queued requests
                            if (
                                state.tonConnect.requestQueue.items.length > 0 &&
                                !state.tonConnect.requestQueue.isProcessing &&
                                state.processNextRequest
                            ) {
                                log.info('Resuming queue processing after rehydration');
                                state.processNextRequest();
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

    // Initialize wallet kit on first load (browser only)
    if (typeof window !== 'undefined') {
        const storeState = store.getState();
        const persistedNetwork = storeState.auth.network || defaultNetwork;
        log.info(`Initializing WalletKit with network: ${persistedNetwork}`);
        storeState.initializeWalletKit(persistedNetwork);
    }

    return store;
}
