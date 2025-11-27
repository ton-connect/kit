/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';

import { createAuthSlice } from './slices/authSlice';
import { createWalletCoreSlice } from './slices/walletCoreSlice';
import { createWalletManagementSlice } from './slices/walletManagementSlice';
import { createTonConnectSlice } from './slices/tonConnectSlice';
import { createJettonsSlice } from './slices/jettonsSlice';
import { createNftsSlice } from './slices/nftsSlice';
import { createComponentLogger } from '../utils/logger';
import type { AppState } from '../types/store';

const log = createComponentLogger('AppStore');

const STORE_VERSION = 2;

const migrate = (persistedState: unknown, fromVersion: number): unknown => {
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

// Create the root store
export const useStore = create<AppState>()(
    devtools(
        subscribeWithSelector(
            persist(
                immer((...a) => ({
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    ...createAuthSlice(...a),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    ...createWalletCoreSlice(...a),
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
                    name: 'demo-wallet-app-store',
                    storage: createJSONStorage(() => localStorage),
                    version: STORE_VERSION,
                    migrate,
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
                    // Merge persisted state with initial state, ensuring all required fields exist
                    merge: (persistedState, currentState) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const persisted = persistedState as any;

                        const merged = {
                            ...currentState,
                            auth: {
                                ...currentState.auth,
                                ...persisted?.auth,
                                network: persisted?.auth?.network || 'testnet',
                                // Auto-unlock if password is persisted
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

                        // Call actions after rehydration (state is already properly merged)
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
    ),
);

// Initialize wallet kit on first load
if (typeof window !== 'undefined') {
    const store = useStore.getState();
    const persistedNetwork = store.auth.network || 'testnet';
    log.info(`Initializing WalletKit with persisted network: ${persistedNetwork}`);
    await store.initializeWalletKit(persistedNetwork);
}

// Hook for accessing WalletKit instance
export const useWalletKit = () => useStore((state) => state.walletCore.walletKit);

// Helper hooks for accessing specific parts of the store
export const useAuth = () =>
    useStore(
        useShallow((state) => ({
            isPasswordSet: state.auth.isPasswordSet,
            isUnlocked: state.auth.isUnlocked,
            persistPassword: state.auth.persistPassword,
            holdToSign: state.auth.holdToSign,
            useWalletInterfaceType: state.auth.useWalletInterfaceType,
            ledgerAccountNumber: state.auth.ledgerAccountNumber,
            network: state.auth.network,
            setPassword: state.setPassword,
            unlock: state.unlock,
            lock: state.lock,
            reset: state.reset,
            setPersistPassword: state.setPersistPassword,
            setHoldToSign: state.setHoldToSign,
            setUseWalletInterfaceType: state.setUseWalletInterfaceType,
            setLedgerAccountNumber: state.setLedgerAccountNumber,
            setNetwork: state.setNetwork,
            createLedgerWallet: state.createLedgerWallet,
        })),
    );

export const useWallet = () =>
    useStore(
        useShallow((state) => ({
            isAuthenticated: state.walletManagement.isAuthenticated,
            hasWallet: state.walletManagement.hasWallet,
            address: state.walletManagement.address,
            balance: state.walletManagement.balance,
            publicKey: state.walletManagement.publicKey,
            transactions: state.walletManagement.transactions,
            currentWallet: state.walletManagement.currentWallet,
            savedWallets: state.walletManagement.savedWallets,
            activeWalletId: state.walletManagement.activeWalletId,
            loadAllWallets: state.loadAllWallets,
            createWallet: state.createWallet,
            importWallet: state.importWallet,
            clearWallet: state.clearWallet,
            updateBalance: state.updateBalance,
            addEvent: state.addEvent,
            addTransaction: state.addTransaction,
            loadEvents: state.loadEvents,
            getDecryptedMnemonic: state.getDecryptedMnemonic,
            getAvailableWallets: state.getAvailableWallets,
            getActiveWallet: state.getActiveWallet,
            switchWallet: state.switchWallet,
            removeWallet: state.removeWallet,
            renameWallet: state.renameWallet,
            createLedgerWallet: state.createLedgerWallet,
        })),
    );

export const useTonConnect = () =>
    useStore(
        useShallow((state) => ({
            pendingConnectRequest: state.tonConnect.pendingConnectRequest,
            isConnectModalOpen: state.tonConnect.isConnectModalOpen,
            handleTonConnectUrl: state.handleTonConnectUrl,
            showConnectRequest: state.showConnectRequest,
            approveConnectRequest: state.approveConnectRequest,
            rejectConnectRequest: state.rejectConnectRequest,
            closeConnectModal: state.closeConnectModal,
        })),
    );

export const useTransactionRequests = () =>
    useStore(
        useShallow((state) => ({
            pendingTransactionRequest: state.tonConnect.pendingTransactionRequest,
            isTransactionModalOpen: state.tonConnect.isTransactionModalOpen,
            showTransactionRequest: state.showTransactionRequest,
            approveTransactionRequest: state.approveTransactionRequest,
            rejectTransactionRequest: state.rejectTransactionRequest,
            closeTransactionModal: state.closeTransactionModal,
        })),
    );

export const useSignDataRequests = () =>
    useStore(
        useShallow((state) => ({
            pendingSignDataRequest: state.tonConnect.pendingSignDataRequest,
            isSignDataModalOpen: state.tonConnect.isSignDataModalOpen,
            showSignDataRequest: state.showSignDataRequest,
            approveSignDataRequest: state.approveSignDataRequest,
            rejectSignDataRequest: state.rejectSignDataRequest,
            closeSignDataModal: state.closeSignDataModal,
        })),
    );

export const useDisconnectEvents = () =>
    useStore(
        useShallow((state) => ({
            disconnectedSessions: state.tonConnect.disconnectedSessions || [],
            handleDisconnectEvent: state.handleDisconnectEvent,
            clearDisconnectNotifications: state.clearDisconnectNotifications,
        })),
    );

export const useNfts = () =>
    useStore(
        useShallow((state) => ({
            userNfts: state.nfts.userNfts,
            lastNftsUpdate: state.nfts.lastNftsUpdate,
            isLoadingNfts: state.nfts.isLoadingNfts,
            isRefreshing: state.nfts.isRefreshing,
            error: state.nfts.error,
            hasMore: state.nfts.hasMore,
            offset: state.nfts.offset,
            loadUserNfts: state.loadUserNfts,
            refreshNfts: state.refreshNfts,
            loadMoreNfts: state.loadMoreNfts,
            clearNfts: state.clearNfts,
            getNftByAddress: state.getNftByAddress,
            formatNftIndex: state.formatNftIndex,
        })),
    );

export const useJettons = () =>
    useStore(
        useShallow((state) => ({
            userJettons: state.jettons.userJettons,
            jettonTransfers: state.jettons.jettonTransfers,
            popularJettons: state.jettons.popularJettons,
            lastJettonsUpdate: state.jettons.lastJettonsUpdate,
            isLoadingJettons: state.jettons.isLoadingJettons,
            isLoadingTransfers: state.jettons.isLoadingTransfers,
            isLoadingPopular: state.jettons.isLoadingPopular,
            isRefreshing: state.jettons.isRefreshing,
            error: state.jettons.error,
            transferError: state.jettons.transferError,
            loadUserJettons: state.loadUserJettons,
            refreshJettons: state.refreshJettons,
            validateJettonAddress: state.validateJettonAddress,
            clearJettons: state.clearJettons,
            getJettonByAddress: state.getJettonByAddress,
            formatJettonAmount: state.formatJettonAmount,
        })),
    );

// Export the main store as useAppStore
export const useAppStore = useStore;
