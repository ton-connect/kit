/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionsUpdate, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { WALLETS_EVENTS } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { watchTransactionsByAddress } from './watch-transactions-by-address';

export interface WatchTransactionsOptions {
    onChange: (update: TransactionsUpdate) => void;
    network?: Network;
}

export type WatchTransactionsReturnType = () => void;

/**
 * Watch transactions for the selected wallet.
 */
export const watchTransactions = (appKit: AppKit, options: WatchTransactionsOptions): WatchTransactionsReturnType => {
    const { network, onChange } = options;
    let unsubscribe: (() => void) | null = null;

    const updateSubscription = () => {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        const selectedWallet = getSelectedWallet(appKit);
        if (selectedWallet) {
            unsubscribe = watchTransactionsByAddress(appKit, {
                address: selectedWallet.getAddress(),
                network: network ?? selectedWallet.getNetwork(),
                onChange,
            });
        }
    };

    const offSelection = appKit.emitter.on(WALLETS_EVENTS.SELECTION_CHANGED, updateSubscription);
    const offUpdate = appKit.emitter.on(WALLETS_EVENTS.UPDATED, updateSubscription);

    updateSubscription();

    return () => {
        if (unsubscribe) unsubscribe();
        offSelection();
        offUpdate();
    };
};
