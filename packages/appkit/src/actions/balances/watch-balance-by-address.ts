/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { BalanceUpdate, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils/network/resolve-network';

/**
 * Options for {@link watchBalanceByAddress}.
 *
 * @public
 * @category Type
 * @section Balances
 */
export interface WatchBalanceByAddressOptions {
    /** Wallet address as a base64url string or an `Address` instance. */
    address: string | Address;
    /** Network to watch on. Defaults to the AppKit's selected network. */
    network?: Network;
    /** Callback fired on every balance update from the streaming provider. */
    onChange: (update: BalanceUpdate) => void;
}

export type WatchBalanceByAddressReturnType = () => void;

/**
 * Subscribe to Toncoin balance updates for an arbitrary address, useful for monitoring wallets that are not currently selected in AppKit (use {@link watchBalance} for the selected wallet).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link WatchBalanceByAddressOptions} Target address, update callback and optional network override.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @sample docs/examples/src/appkit/actions/balances#WATCH_BALANCE_BY_ADDRESS
 * @expand options
 *
 * @public
 * @category Action
 * @section Balances
 */
export const watchBalanceByAddress = (
    appKit: AppKit,
    options: WatchBalanceByAddressOptions,
): WatchBalanceByAddressReturnType => {
    const { address, network, onChange } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();
    const resolvedNetwork = resolveNetwork(appKit, network);

    return appKit.streamingManager.watchBalance(resolvedNetwork, addressString, onChange);
};
