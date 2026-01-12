/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import { useJettons, useNfts, useWallet } from '@demo/wallet-core';

export const useWalletDataUpdater = () => {
    const { address, updateBalance } = useWallet();
    const { loadUserJettons, clearJettons, refreshJettons } = useJettons();
    const { loadUserNfts, clearNfts, refreshNfts } = useNfts();

    // Update on address change
    useEffect(() => {
        if (address) {
            clearNfts();
            clearJettons();
            void Promise.allSettled([updateBalance(), loadUserJettons(), loadUserNfts()]);
        }
    }, [address, updateBalance, loadUserJettons, loadUserNfts, clearNfts, clearJettons]);

    // Periodic refresh
    useEffect(() => {
        if (!address) return;

        const timeout = setInterval(() => {
            void Promise.allSettled([updateBalance(), refreshJettons(), refreshNfts()]);
        }, 30_000);

        return () => {
            clearInterval(timeout);
        };
    }, [address, updateBalance, refreshJettons, refreshNfts]);
};
