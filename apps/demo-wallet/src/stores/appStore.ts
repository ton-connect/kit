import { create } from 'zustand';
import { devtools, persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';

import { createAuthSlice } from './slices/authSlice';
import { createWalletSlice, setupWalletKitListeners } from './slices/walletSlice';
import { createJettonsSlice } from './slices/jettonsSlice';
import { createNftsSlice } from './slices/nftsSlice';
import { createComponentLogger } from '../utils/logger';
import type { AppState } from '../types/store';

// Create logger for app store
const log = createComponentLogger('AppStore');

// Current store version for migrations
const STORE_VERSION = 1;

// Migration function
const migrate = (persistedState: unknown, fromVersion: number): unknown => {
    log.info('Migrating store from version', fromVersion, 'to', STORE_VERSION);

    // Handle migrations based on version
    if (fromVersion < 1) {
        // Migration from v0 (separate stores) to v1 (combined store)
        // This handles the case where users might have old separate persisted data
        const state = persistedState as Record<string, unknown>;
        const migratedState = {
            auth: {
                isPasswordSet: (state.isPasswordSet as boolean) || false,
                passwordHash: state.passwordHash as number[],
                isUnlocked: false, // Never persist unlocked state
            },
            wallet: {
                hasWallet: (state.hasWallet as boolean) || false,
                isAuthenticated: false, // Never persist authentication
                transactions: (state.transactions as unknown[]) || [],
                encryptedMnemonic: state.encryptedMnemonic as string, // Migrate encrypted mnemonic
                ledgerConfig: undefined, // Initialize ledgerConfig for new installations
                disconnectedSessions: [], // Always initialize as empty array
            },
        };

        return migratedState;
    }

    return persistedState;
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
                    ...createWalletSlice(...a),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    ...createJettonsSlice(...a),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    ...createNftsSlice(...a),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                })) as unknown as any,
                {
                    name: 'demo-wallet-app-store', // ✅ one clean key
                    storage: createJSONStorage(() => localStorage),
                    version: STORE_VERSION,
                    migrate,
                    // Only persist long-lived data organized by slices:
                    partialize: (state) => ({
                        auth: {
                            isPasswordSet: state.auth.isPasswordSet,
                            passwordHash: state.auth.passwordHash,
                            persistPassword: state.auth.persistPassword,
                            useWalletInterfaceType: state.auth.useWalletInterfaceType,
                            ledgerAccountNumber: state.auth.ledgerAccountNumber,
                            // Conditionally persist password based on user setting
                            ...(state.auth.persistPassword && {
                                currentPassword: state.auth.currentPassword,
                            }),
                            // isUnlocked: omit - never persist unlocked state for security
                        },
                        wallet: {
                            hasWallet: state.wallet.hasWallet,
                            encryptedMnemonic: state.wallet.encryptedMnemonic,
                            ledgerConfig: state.wallet.ledgerConfig,

                            isSignDataModalOpen: state.wallet.isSignDataModalOpen,
                            isTransactionModalOpen: state.wallet.isTransactionModalOpen,
                            isConnectModalOpen: state.wallet.isConnectModalOpen,

                            pendingSignDataRequest: state.wallet.pendingSignDataRequest,
                            pendingTransactionRequest: state.wallet.pendingTransactionRequest,
                            pendingConnectRequest: state.wallet.pendingConnectRequest,
                        },
                        // jettons: {
                        //     userJettons: state.jettons.userJettons,
                        //     popularJettons: state.jettons.popularJettons,
                        //     lastJettonsUpdate: state.jettons.lastJettonsUpdate,
                        //     lastPopularUpdate: state.jettons.lastPopularUpdate,
                        //     // Don't persist: loading states, errors, transfer history
                        // },
                        // isAuthenticated: omit - never persist authentication for security
                        // },
                        // Never persist these sensitive/runtime values:
                        // - currentPassword (security)
                        // - currentWallet (contains methods and client instances)
                        // - pendingConnectRequest (runtime state)
                        // - isConnectModalOpen (UI state)
                    }),
                    onRehydrateStorage: () => (state, error) => {
                        if (error) {
                            log.error('Store rehydration error:', error);
                        } else if (state) {
                            log.info('Store rehydrated successfully');
                            // Ensure disconnectedSessions is always initialized
                            if (!state.wallet.disconnectedSessions) {
                                state.wallet.disconnectedSessions = [];
                            }
                            // Auto-unlock if password is persisted and available
                            if (
                                state.auth.persistPassword &&
                                state.auth.currentPassword &&
                                state.auth.isPasswordSet &&
                                !state.auth.isUnlocked
                            ) {
                                log.info('Auto-unlocking wallet with persisted password');
                                state.auth.isUnlocked = true;
                            }

                            if (state.wallet.encryptedMnemonic && !state.wallet.hasWallet) {
                                log.info('Auto-creating wallet with persisted mnemonic');
                                state.wallet.hasWallet = true;
                            }

                            if (!state.wallet.transactions) {
                                state.wallet.transactions = [];
                            }
                        }
                    },
                },
            ),
        ),
    ),
);

// Initialize wallet kit listeners on first load
if (typeof window !== 'undefined') {
    // Set up wallet kit listeners with the store's request handlers
    const store = useStore.getState();
    setupWalletKitListeners(
        store.showConnectRequest,
        store.showTransactionRequest,
        store.showSignDataRequest,
        store.handleDisconnectEvent,
    );
}

// Helper hooks for accessing specific parts of the store
export const useAuth = () =>
    useStore(
        useShallow((state) => ({
            isPasswordSet: state.auth.isPasswordSet,
            isUnlocked: state.auth.isUnlocked,
            persistPassword: state.auth.persistPassword,
            useWalletInterfaceType: state.auth.useWalletInterfaceType,
            ledgerAccountNumber: state.auth.ledgerAccountNumber,
            setPassword: state.setPassword,
            unlock: state.unlock,
            lock: state.lock,
            reset: state.reset,
            setPersistPassword: state.setPersistPassword,
            setUseWalletInterfaceType: state.setUseWalletInterfaceType,
            setLedgerAccountNumber: state.setLedgerAccountNumber,
            createLedgerWallet: state.createLedgerWallet,
        })),
    );

export const useWallet = () =>
    useStore(
        useShallow((state) => ({
            isAuthenticated: state.wallet.isAuthenticated,
            hasWallet: state.wallet.hasWallet,
            address: state.wallet.address,
            balance: state.wallet.balance,
            publicKey: state.wallet.publicKey,
            transactions: state.wallet.transactions,
            currentWallet: state.wallet.currentWallet,
            createWallet: state.createWallet,
            importWallet: state.importWallet,
            loadWallet: state.loadWallet,
            clearWallet: state.clearWallet,
            updateBalance: state.updateBalance,
            addTransaction: state.addTransaction,
            loadTransactions: state.loadTransactions,
            getDecryptedMnemonic: state.getDecryptedMnemonic,
            getAvailableWallets: state.getAvailableWallets,
            createLedgerWallet: state.createLedgerWallet,
        })),
    );

export const useTonConnect = () =>
    useStore(
        useShallow((state) => ({
            pendingConnectRequest: state.wallet.pendingConnectRequest,
            isConnectModalOpen: state.wallet.isConnectModalOpen,
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
            pendingTransactionRequest: state.wallet.pendingTransactionRequest,
            isTransactionModalOpen: state.wallet.isTransactionModalOpen,
            showTransactionRequest: state.showTransactionRequest,
            approveTransactionRequest: state.approveTransactionRequest,
            rejectTransactionRequest: state.rejectTransactionRequest,
            closeTransactionModal: state.closeTransactionModal,
        })),
    );

export const useSignDataRequests = () =>
    useStore(
        useShallow((state) => ({
            pendingSignDataRequest: state.wallet.pendingSignDataRequest,
            isSignDataModalOpen: state.wallet.isSignDataModalOpen,
            showSignDataRequest: state.showSignDataRequest,
            approveSignDataRequest: state.approveSignDataRequest,
            rejectSignDataRequest: state.rejectSignDataRequest,
            closeSignDataModal: state.closeSignDataModal,
        })),
    );

export const useDisconnectEvents = () =>
    useStore(
        useShallow((state) => ({
            disconnectedSessions: state.wallet.disconnectedSessions || [],
            handleDisconnectEvent: state.handleDisconnectEvent,
            clearDisconnectNotifications: state.clearDisconnectNotifications,
        })),
    );

export const useNfts = () =>
    useStore(
        useShallow((state) => ({
            // Data
            userNfts: state.nfts.userNfts,
            lastNftsUpdate: state.nfts.lastNftsUpdate,

            // Loading states
            isLoadingNfts: state.nfts.isLoadingNfts,
            isRefreshing: state.nfts.isRefreshing,

            // Error states
            error: state.nfts.error,

            // Pagination
            hasMore: state.nfts.hasMore,
            offset: state.nfts.offset,

            // Actions
            loadUserNfts: state.loadUserNfts,
            refreshNfts: state.refreshNfts,
            loadMoreNfts: state.loadMoreNfts,
            clearNfts: state.clearNfts,

            // Utilities
            getNftByAddress: state.getNftByAddress,
            formatNftIndex: state.formatNftIndex,
        })),
    );

export const useJettons = () =>
    useStore(
        useShallow((state) => ({
            // Data
            userJettons: state.jettons.userJettons,
            jettonTransfers: state.jettons.jettonTransfers,
            popularJettons: state.jettons.popularJettons,
            lastJettonsUpdate: state.jettons.lastJettonsUpdate,

            // Loading states
            isLoadingJettons: state.jettons.isLoadingJettons,
            isLoadingTransfers: state.jettons.isLoadingTransfers,
            isLoadingPopular: state.jettons.isLoadingPopular,
            isRefreshing: state.jettons.isRefreshing,

            // Error states
            error: state.jettons.error,
            transferError: state.jettons.transferError,

            // Actions
            loadUserJettons: state.loadUserJettons,
            refreshJettons: state.refreshJettons,
            loadJettonTransfers: state.loadJettonTransfers,
            loadPopularJettons: state.loadPopularJettons,
            searchJettons: state.searchJettons,
            getJettonBalance: state.getJettonBalance,
            validateJettonAddress: state.validateJettonAddress,
            clearJettons: state.clearJettons,

            // Utilities
            getJettonByAddress: state.getJettonByAddress,
            formatJettonAmount: state.formatJettonAmount,
        })),
    );

// Export the main store as useAppStore for backward compatibility
export const useAppStore = useStore;
