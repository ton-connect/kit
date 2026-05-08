/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { WALLETS_EVENTS } from '../../core/app-kit';
import type { TransactionsUpdate } from '../../core/streaming';
import type { Network } from '../../types/network';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { watchTransactionsByAddress } from './watch-transactions-by-address';

/**
 * Options for {@link watchTransactions}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export interface WatchTransactionsOptions {
    /** Callback fired on every transactions update from the streaming provider. */
    onChange: (update: TransactionsUpdate) => void;
    /** Network to watch on. Defaults to the selected wallet's network. */
    network?: Network;
}

/**
 * Return type of {@link watchTransactions} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type WatchTransactionsReturnType = () => void;

/**
 * Subscribe to incoming-transaction events for the currently selected wallet, automatically rebinding when the user connects, switches, or disconnects (use {@link watchTransactionsByAddress} for a fixed address).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link WatchTransactionsOptions} Update callback and optional network override.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @expand options
 *
 * @public
 * @category Action
 * @section Transactions
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
