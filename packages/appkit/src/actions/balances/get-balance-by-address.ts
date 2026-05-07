/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { TokenAmount, Network } from '@ton/walletkit';
import { formatUnits } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils/network/resolve-network';

export interface GetBalanceByAddressOptions {
    /** Wallet address as a base64url string or an `Address` instance. */
    address: string | Address;
    /** Network to read the balance from. Defaults to the AppKit's selected network. */
    network?: Network;
}

export type GetBalanceByAddressReturnType = TokenAmount;

/**
 * Read the Toncoin balance of an arbitrary address.
 *
 * Use this when you need to look up a balance for any wallet, not just the
 * one currently selected in AppKit. For the selected wallet's balance use
 * `getBalance`.
 *
 * @param appKit - AppKit runtime instance.
 * @param options - Address to query and optional network override.
 * @returns Balance amount as a `TokenAmount` (string nanos with token metadata).
 *
 * @example
 * ```ts
 * const balance = await getBalanceByAddress(appKit, {
 *     address: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N',
 * });
 * console.log(balance);
 * ```
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
