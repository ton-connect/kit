/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JettonUpdate, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { WALLETS_EVENTS } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { watchJettonsByAddress } from './watch-jettons-by-address';

export interface WatchJettonsOptions {
    onChange: (update: JettonUpdate) => void;
    network?: Network;
}

export type WatchJettonsReturnType = () => void;

/**
 * Watch jetton updates for the selected wallet.
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
