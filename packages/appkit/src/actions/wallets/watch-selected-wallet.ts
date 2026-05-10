/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { WALLETS_EVENTS } from '../../core/app-kit';
import { getSelectedWallet } from '../../actions';
import type { WalletInterface } from '../../types/wallet';

/**
 * Parameters accepted by {@link watchSelectedWallet}.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export interface WatchSelectedWalletParameters {
    /** Callback fired whenever the selected wallet changes — receives the new wallet, or `null` when the selection was cleared. */
    onChange: (wallet: WalletInterface | null) => void;
}

/**
 * Return type of {@link watchSelectedWallet} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type WatchSelectedWalletReturnType = () => void;

/**
 * Subscribe to selected-wallet changes — fires when {@link setSelectedWalletId} is called or when AppKit's wallet manager swaps the selection in response to connection events (auto-selecting the first wallet after a connect, clearing it on full disconnect).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchSelectedWalletParameters} Update callback.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @sample docs/examples/src/appkit/actions/wallets#WATCH_SELECTED_WALLET
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Wallets
 */
export const watchSelectedWallet = (
    appKit: AppKit,
    parameters: WatchSelectedWalletParameters,
): WatchSelectedWalletReturnType => {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(WALLETS_EVENTS.SELECTION_CHANGED, () => {
        const wallet = getSelectedWallet(appKit);
        onChange(wallet ?? null);
    });

    return unsubscribe;
};
