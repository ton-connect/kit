/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

/**
 * Parameters accepted by {@link setSelectedWalletId}.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export interface SetSelectedWalletIdParameters {
    /** Wallet ID (as returned by {@link WalletInterface}'s `getWalletId()`) to select; pass `null` to clear the selection. */
    walletId: string | null;
}

/**
 * Return type of {@link setSelectedWalletId}.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type SetSelectedWalletIdReturnType = void;

/**
 * Switch which connected wallet AppKit treats as selected — emits `WALLETS_EVENTS.SELECTION_CHANGED` so {@link watchSelectedWallet} subscribers fire. Pass `null` to clear the selection.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link SetSelectedWalletIdParameters} Wallet ID to select, or `null` to clear.
 *
 * @sample docs/examples/src/appkit/actions/wallets#SET_SELECTED_WALLET_ID
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Wallets
 */
export const setSelectedWalletId = (
    appKit: AppKit,
    parameters: SetSelectedWalletIdParameters,
): SetSelectedWalletIdReturnType => {
    appKit.walletsManager.setSelectedWalletId(parameters.walletId);
};
