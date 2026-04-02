/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import { useAuth, useJettons, useNfts, useWallet } from '@demo/wallet-core';

export const useWalletDataUpdater = () => {
    const { address, updateBalance, hasWallet, currentWallet, loadAllWallets } = useWallet();
    const { isUnlocked } = useAuth();
    const { loadUserJettons, clearJettons } = useJettons();
    const { loadUserNfts, clearNfts, refreshNfts } = useNfts();

    // Load wallets when hasWallet but currentWallet missing (e.g. refresh on /send before rehydration)
    useEffect(() => {
        if (hasWallet && isUnlocked && !currentWallet) {
            void loadAllWallets();
        }
    }, [hasWallet, isUnlocked, currentWallet, loadAllWallets]);

    // Update on address change
    useEffect(() => {
        if (address) {
            clearNfts();
            clearJettons();
            void Promise.allSettled([updateBalance(), loadUserJettons(), loadUserNfts()]);
        }
    }, [address, updateBalance, loadUserJettons, loadUserNfts, clearNfts, clearJettons]);

    // Periodic refresh for NFTs only (balance and jettons are updated via WebSocket streaming)
    useEffect(() => {
        if (!address) return;

        const timeout = setInterval(() => {
            void refreshNfts();
        }, 60_000);

        return () => clearInterval(timeout);
    }, [address, refreshNfts]);
};
