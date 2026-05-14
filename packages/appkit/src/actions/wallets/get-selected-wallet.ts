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
 * Return type of {@link getSelectedWallet} — `null` when no wallet is currently selected.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type GetSelectedWalletReturnType = WalletInterface | null;

/**
 * Read the wallet AppKit treats as "active" — most actions ({@link getBalance}, {@link signText}, {@link transferTon}) target this wallet implicitly. Returns `null` when no wallet is connected or selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns Selected {@link WalletInterface}, or `null` when none is selected.
 *
 * @sample docs/examples/src/appkit/actions/wallets#GET_SELECTED_WALLET
 *
 * @public
 * @category Action
 * @section Wallets
 */
export const getSelectedWallet = (appKit: AppKit): GetSelectedWalletReturnType => {
    return appKit.walletsManager.selectedWallet;
};
