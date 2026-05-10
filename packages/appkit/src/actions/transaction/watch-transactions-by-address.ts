/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import type { AppKit } from '../../core/app-kit';
import type { TransactionsUpdate } from '../../core/streaming';
import type { Network } from '../../types/network';
import type { UserFriendlyAddress } from '../../types/primitives';
import { resolveNetwork } from '../../utils/network/resolve-network';

/**
 * Options for {@link watchTransactionsByAddress}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export interface WatchTransactionsByAddressOptions {
    /** Address to watch — pass a {@link UserFriendlyAddress} string or an `Address` instance from `@ton/core`. */
    address: UserFriendlyAddress | Address;
    /** Callback fired on every transactions update from the streaming provider. */
    onChange: (update: TransactionsUpdate) => void;
    /** Network to watch on. Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set. */
    network?: Network;
}

/**
 * Return type of {@link watchTransactionsByAddress} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type WatchTransactionsByAddressReturnType = () => void;

/**
 * Subscribe to incoming-transaction events for an arbitrary address (use {@link watchTransactions} for the selected wallet).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link WatchTransactionsByAddressOptions} Address, update callback and optional network override.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @expand options
 *
 * @public
 * @category Action
 * @section Transactions
 */
export const watchTransactionsByAddress = (
    appKit: AppKit,
    options: WatchTransactionsByAddressOptions,
): WatchTransactionsByAddressReturnType => {
    const { address, network, onChange } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();
    const resolvedNetwork = resolveNetwork(appKit, network);

    return appKit.streamingManager.watchTransactions(resolvedNetwork, addressString, onChange);
};
