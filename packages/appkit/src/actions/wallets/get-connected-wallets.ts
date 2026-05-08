/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { WalletInterface } from '../../types/wallet';

/**
 * Return type of {@link getConnectedWallets} — read-only snapshot of the active wallet list.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type GetConnectedWalletsReturnType = readonly WalletInterface[];

/**
 * List every wallet currently connected through any registered {@link Connector}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns Read-only array of {@link WalletInterface}s.
 *
 * @sample docs/examples/src/appkit/actions/wallets#GET_CONNECTED_WALLETS
 *
 * @public
 * @category Action
 * @section Wallets
 */
export const getConnectedWallets = (appKit: AppKit): GetConnectedWalletsReturnType => {
    return appKit.walletsManager.wallets;
};
