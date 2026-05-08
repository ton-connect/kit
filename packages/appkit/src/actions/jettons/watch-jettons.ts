/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { WALLETS_EVENTS } from '../../core/app-kit';
import type { JettonUpdate } from '../../core/streaming';
import type { Network } from '../../types/network';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { watchJettonsByAddress } from './watch-jettons-by-address';

/**
 * Options for {@link watchJettons}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export interface WatchJettonsOptions {
    /** Callback fired on every jetton-balance update from the streaming provider. */
    onChange: (update: JettonUpdate) => void;
    /** Network to watch on. Defaults to the selected wallet's network. */
    network?: Network;
}

/**
 * Return type of {@link watchJettons} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type WatchJettonsReturnType = () => void;

/**
 * Subscribe to jetton-balance updates for the currently selected wallet, automatically rebinding when the user connects, switches, or disconnects (use {@link watchJettonsByAddress} for a fixed address).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link WatchJettonsOptions} Update callback and optional network override.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @expand options
 *
 * @public
 * @category Action
 * @section Jettons
 */
export const watchJettons = (appKit: AppKit, options: WatchJettonsOptions): WatchJettonsReturnType => {
    const { network, onChange } = options;
    let unsubscribe: (() => void) | null = null;

    const updateSubscription = () => {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        const selectedWallet = getSelectedWallet(appKit);
        if (selectedWallet) {
            unsubscribe = watchJettonsByAddress(appKit, {
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
