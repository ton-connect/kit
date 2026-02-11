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

export interface WatchSelectedWalletParameters {
    onChange: (wallet: WalletInterface | null) => void;
}

export type WatchSelectedWalletReturnType = () => void;

/**
 * Watch selected wallet
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
