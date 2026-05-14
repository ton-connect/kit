/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { WALLETS_EVENTS } from '../../core/app-kit';
import type { WalletInterface } from '../../types/wallet';

/**
 * Parameters accepted by {@link watchConnectedWallets}.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type WatchConnectedWalletsParameters = {
    /** Callback fired whenever the list of connected wallets changes — receives the latest snapshot. */
    onChange: (wallets: WalletInterface[]) => void;
};

/**
 * Return type of {@link watchConnectedWallets} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type WatchConnectedWalletsReturnType = () => void;

/**
 * Subscribe to the list of connected wallets — fires whenever a wallet connects or disconnects through any registered {@link Connector}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchConnectedWalletsParameters} Update callback.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @sample docs/examples/src/appkit/actions/wallets#WATCH_CONNECTED_WALLETS
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Wallets
 */
export const watchConnectedWallets = (
    appKit: AppKit,
    parameters: WatchConnectedWalletsParameters,
): WatchConnectedWalletsReturnType => {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(WALLETS_EVENTS.UPDATED, (data) => {
        onChange(data.payload.wallets);
    });

    return unsubscribe;
};
