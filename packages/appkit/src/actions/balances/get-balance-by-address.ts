/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import type { AppKit } from '../../core/app-kit';
import type { TokenAmount, UserFriendlyAddress } from '../../types/primitives';
import type { Network } from '../../types/network';
import { formatUnits } from '../../utils';
import { resolveNetwork } from '../../utils/network/resolve-network';

/**
 * Options for {@link getBalanceByAddress}.
 *
 * @public
 * @category Type
 * @section Balances
 */
export interface GetBalanceByAddressOptions {
    /** Wallet address — pass a {@link UserFriendlyAddress} string or an `Address` instance from `@ton/core`. */
    address: UserFriendlyAddress | Address;
    /** Network to read the balance from. Defaults to the connected wallet's network, or the configured default if no wallet is connected. */
    network?: Network;
}

/**
 * Return type of {@link getBalanceByAddress}.
 *
 * @public
 * @category Type
 * @section Balances
 */
export type GetBalanceByAddressReturnType = TokenAmount;

/**
 * Read the Toncoin balance of an arbitrary address — useful for wallets that aren't selected in AppKit (use {@link getBalance} for the selected wallet).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetBalanceByAddressOptions} Target address and optional network.
 * @returns Balance in TON as a human-readable decimal string.
 *
 * @sample docs/examples/src/appkit/actions/balances#GET_BALANCE_BY_ADDRESS
 * @expand options
 *
 * @public
 * @category Action
 * @section Balances
 */
export const getBalanceByAddress = async (
    appKit: AppKit,
    options: GetBalanceByAddressOptions,
): Promise<GetBalanceByAddressReturnType> => {
    const { address, network } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));
    const balance = await client.getBalance(addressString);

    return formatUnits(balance, 9);
};
