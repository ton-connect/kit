/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';
import type { ConnectedWallet, Wallet, WalletInfoWithOpenMethod } from '@ton/appkit-ui';

import { useTonConnectUI } from './useTonConnectUI';

/**
 * Use it to get user's current ton wallet. If wallet is not connected hook will return null.
 */
export function useTonWallet(): Wallet | (Wallet & WalletInfoWithOpenMethod) | null {
    const [tonConnectUI] = useTonConnectUI();
    const [wallet, setWallet] = useState<Wallet | (Wallet & WalletInfoWithOpenMethod) | null>(
        tonConnectUI?.wallet || null,
    );

    useEffect(() => {
        if (tonConnectUI) {
            setWallet(tonConnectUI.wallet);
            return tonConnectUI.onStatusChange((value: ConnectedWallet | null) => {
                setWallet(value);
            });
        }
    }, [tonConnectUI]);

    return wallet;
}
