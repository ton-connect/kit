import { create } from 'zustand';
import { devtools, persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';

import { createAuthSlice } from './slices/authSlice';
import { createWalletSlice, setupWalletKitListeners } from './slices/walletSlice';
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
                            isUnlocked: state.auth.isUnlocked,
                            currentPassword: state.auth.currentPassword,
                            // isUnlocked: omit - never persist unlocked state for security
                        },
                        wallet: {
                            hasWallet: state.wallet.hasWallet,
                            transactions: state.wallet.transactions,
                            encryptedMnemonic: state.wallet.encryptedMnemonic,
                        },
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
                            // Set up wallet kit listeners after rehydration
                            // setupWalletKitListeners(state.showConnectRequest);
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
    setupWalletKitListeners(store.showConnectRequest, store.showTransactionRequest, store.showSignDataRequest);
}

// Helper hooks for accessing specific parts of the store
export const useAuth = () =>
    useStore(
        useShallow((state) => ({
            isPasswordSet: state.auth.isPasswordSet,
            isUnlocked: state.auth.isUnlocked,
            setPassword: state.setPassword,
            unlock: state.unlock,
            lock: state.lock,
            reset: state.reset,
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
            getDecryptedMnemonic: state.getDecryptedMnemonic,
            getAvailableWallets: state.getAvailableWallets,
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

// Export the main store as useAppStore for backward compatibility
export const useAppStore = useStore;
