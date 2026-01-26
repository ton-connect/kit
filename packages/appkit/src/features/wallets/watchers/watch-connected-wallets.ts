/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../../core/app-kit';
import { WALLETS_EVENTS } from '../../../core/events';
import type { WalletInterface } from '../types/wallet';

export type WatchConnectedWalletsParameters = {
    onChange: (wallets: WalletInterface[]) => void;
};

export type WatchConnectedWalletsReturnType = () => void;

/**
 * Watch connected wallets
 */
export function watchConnectedWallets(
    appKit: AppKit,
    parameters: WatchConnectedWalletsParameters,
): WatchConnectedWalletsReturnType {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(WALLETS_EVENTS.UPDATED, (data) => {
        onChange(data.payload.wallets);
    });

    return unsubscribe;
}
