/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useContext } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { WalletStoreContext } from '../providers/WalletProvider';
import type { AppState } from '../types/store';

/**
 * Hook to access the wallet store
 */
export function useWalletStore<T>(selector: (state: AppState) => T): T {
    const store = useContext(WalletStoreContext);
    if (!store) {
        throw new Error('useWalletStore must be used within WalletProvider');
    }
    return useStore(store, selector);
}

/**
 * Hook to access WalletKit instance
 */
export const useWalletKit = () => {
    return useWalletStore((state) => state.walletCore.walletKit);
};

/**
 * Hook for authentication state and actions
 */
export const useAuth = () => {
    return useWalletStore(
        useShallow((state) => ({
            isPasswordSet: state.auth.isPasswordSet,
            isUnlocked: state.auth.isUnlocked,
            persistPassword: state.auth.persistPassword,
            holdToSign: state.auth.holdToSign,
            useWalletInterfaceType: state.auth.useWalletInterfaceType,
            ledgerAccountNumber: state.auth.ledgerAccountNumber,
            setPassword: state.setPassword,
            unlock: state.unlock,
            lock: state.lock,
            reset: state.reset,
            setPersistPassword: state.setPersistPassword,
            setHoldToSign: state.setHoldToSign,
            setUseWalletInterfaceType: state.setUseWalletInterfaceType,
            setLedgerAccountNumber: state.setLedgerAccountNumber,
            createLedgerWallet: state.createLedgerWallet,
        })),
    );
};

/**
 * Hook for wallet state and management
 */
export const useWallet = () => {
    return useWalletStore(
        useShallow((state) => ({
            isAuthenticated: state.walletManagement.isAuthenticated,
            hasWallet: state.walletManagement.hasWallet,
            address: state.walletManagement.address,
            balance: state.walletManagement.balance,
            publicKey: state.walletManagement.publicKey,
            events: state.walletManagement.events,
            currentWallet: state.walletManagement.currentWallet,
            savedWallets: state.walletManagement.savedWallets,
            activeWalletId: state.walletManagement.activeWalletId,
            loadAllWallets: state.loadAllWallets,
            createWallet: state.createWallet,
            importWallet: state.importWallet,
            clearWallet: state.clearWallet,
            updateBalance: state.updateBalance,
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
};

/**
 * Hook for TON Connect state and actions
 */
export const useTonConnect = () => {
    return useWalletStore(
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
};

/**
 * Hook for transaction requests
 */
export const useTransactionRequests = () => {
    return useWalletStore(
        useShallow((state) => ({
            pendingTransactionRequest: state.tonConnect.pendingTransactionRequest,
            isTransactionModalOpen: state.tonConnect.isTransactionModalOpen,
            showTransactionRequest: state.showTransactionRequest,
            approveTransactionRequest: state.approveTransactionRequest,
            rejectTransactionRequest: state.rejectTransactionRequest,
            closeTransactionModal: state.closeTransactionModal,
        })),
    );
};

/**
 * Hook for sign data requests
 */
export const useSignDataRequests = () => {
    return useWalletStore(
        useShallow((state) => ({
            pendingSignDataRequest: state.tonConnect.pendingSignDataRequest,
            isSignDataModalOpen: state.tonConnect.isSignDataModalOpen,
            showSignDataRequest: state.showSignDataRequest,
            approveSignDataRequest: state.approveSignDataRequest,
            rejectSignDataRequest: state.rejectSignDataRequest,
            closeSignDataModal: state.closeSignDataModal,
        })),
    );
};

/**
 * Hook for disconnect events
 */
export const useDisconnectEvents = () => {
    return useWalletStore(
        useShallow((state) => ({
            disconnectedSessions: state.tonConnect.disconnectedSessions || [],
            handleDisconnectEvent: state.handleDisconnectEvent,
            clearDisconnectNotifications: state.clearDisconnectNotifications,
        })),
    );
};

/**
 * Hook for NFTs
 */
export const useNfts = () => {
    return useWalletStore(
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
};

/**
 * Hook for Jettons
 */
export const useJettons = () => {
    return useWalletStore(
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
};
