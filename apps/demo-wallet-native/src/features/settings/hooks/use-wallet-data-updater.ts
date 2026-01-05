/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import { useWallet, loadUserJettons, updateBalance } from '@demo/core';

export const useWalletDataUpdater = () => {
    const { address } = useWallet();

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
