/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BalanceUpdate, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { WALLETS_EVENTS } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { watchBalanceByAddress } from './watch-balance-by-address';

export interface WatchBalanceOptions {
    network?: Network;
    onChange: (update: BalanceUpdate) => void;
}

export type WatchBalanceReturnType = () => void;

/**
 * Watch account balance changes for the selected wallet.
 */
export const watchBalance = (appKit: AppKit, options: WatchBalanceOptions): WatchBalanceReturnType => {
    const { network, onChange } = options;
    let unsubscribe: (() => void) | null = null;

    const updateSubscription = () => {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        const selectedWallet = getSelectedWallet(appKit);
        if (selectedWallet) {
            unsubscribe = watchBalanceByAddress(appKit, {
                address: selectedWallet.getAddress(),
                network: network ?? selectedWallet.getNetwork(),
                onChange,
            });
        }
    };

    const off = appKit.emitter.on(WALLETS_EVENTS.SELECTION_CHANGED, updateSubscription);
    const offUpdate = appKit.emitter.on(WALLETS_EVENTS.UPDATED, updateSubscription);

    updateSubscription();

    return () => {
        if (unsubscribe) unsubscribe();
        off();
        offUpdate();
    };
};
