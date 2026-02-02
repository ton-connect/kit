/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import { useJettons, useWallet } from '@demo/wallet-core';

export const useWalletDataUpdater = () => {
    const { address, updateBalance } = useWallet();
    const { loadUserJettons } = useJettons();

    // Update on address change
    useEffect(() => {
        if (address) {
            void updateBalance();
            void loadUserJettons();
        }
    }, [address, updateBalance, loadUserJettons]);

    // Periodic refresh
    useEffect(() => {
        if (!address) return;

        const timeout = setInterval(() => {
            void updateBalance();
            void loadUserJettons();
        }, 30_000);

        return () => {
            clearInterval(timeout);
        };
    }, [address, updateBalance, loadUserJettons]);
};
