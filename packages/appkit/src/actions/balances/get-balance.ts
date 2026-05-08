/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { TokenAmount } from '../../types/primitives';
import type { Network } from '../../types/network';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { getBalanceByAddress } from './get-balance-by-address';

/**
 * Options for {@link getBalance}.
 *
 * @public
 * @category Type
 * @section Balances
 */
export interface GetBalanceOptions {
    /** Network to read the balance from. Defaults to the selected wallet's network. */
    network?: Network;
}

export type GetBalanceReturnType = TokenAmount | null;

/**
 * Read the Toncoin balance of the currently selected wallet, returning `null` when no wallet is connected (use {@link getBalanceByAddress} for an arbitrary address).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetBalanceOptions} Optional network override.
 * @returns Balance in TON as a human-readable decimal string, or `null` when no wallet is selected.
 *
 * @sample docs/examples/src/appkit/actions/balances#GET_BALANCE
 * @expand options
 *
 * @public
 * @category Action
 * @section Balances
 */
export const getBalance = async (appKit: AppKit, options: GetBalanceOptions = {}): Promise<GetBalanceReturnType> => {
    const selectedWallet = getSelectedWallet(appKit);

    if (!selectedWallet) {
        return null;
    }

    return getBalanceByAddress(appKit, {
        address: selectedWallet.getAddress(),
        network: options.network ?? selectedWallet.getNetwork(),
    });
};
