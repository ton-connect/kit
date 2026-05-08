/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { getBalanceByAddress } from './get-balance-by-address';
import type { Network } from '../../types/network';

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
 * Read the Toncoin balance of the currently selected wallet.
 *
 * Returns `null` when no wallet is connected (rather than throwing), so the
 * UI layer can render an empty state without an error path. For an
 * arbitrary address use {@link getBalanceByAddress}.
 *
 * @param appKit - {@link AppKit} runtime instance.
 * @param options - {@link GetBalanceOptions} with optional network override.
 * @returns Balance in TON as a human-readable decimal string, or `null` if no wallet is selected.
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
