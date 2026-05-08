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

/**
 * Options for {@link watchBalance}.
 *
 * @public
 * @category Type
 * @section Balances
 */
export interface WatchBalanceOptions {
    /** Network to watch on. Defaults to the selected wallet's network. */
    network?: Network;
    /** Callback fired on every balance update from the streaming provider. */
    onChange: (update: BalanceUpdate) => void;
}

export type WatchBalanceReturnType = () => void;

/**
 * Subscribe to Toncoin balance updates for the currently selected wallet, automatically rebinding when the user connects, switches, or disconnects (use {@link watchBalanceByAddress} for a fixed address).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link WatchBalanceOptions} Update callback and optional network override.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @sample docs/examples/src/appkit/actions/balances#WATCH_BALANCE
 * @expand options
 *
 * @public
 * @category Action
 * @section Balances
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
