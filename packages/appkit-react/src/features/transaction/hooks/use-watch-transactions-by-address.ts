/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import { watchTransactionsByAddress, hasStreamingProvider, resolveNetwork } from '@ton/appkit';
import type { WatchTransactionsByAddressOptions, TransactionsUpdate } from '@ton/appkit';

import { useAppKit } from '../../settings';

/**
 * Parameters accepted by {@link useWatchTransactionsByAddress} — same fields as {@link appkit:WatchTransactionsByAddressOptions}, all optional so callers can render the hook before the address is known.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type UseWatchTransactionsByAddressParameters = Partial<WatchTransactionsByAddressOptions>;

/**
 * Subscribe to incoming-transaction events for an arbitrary address (use {@link useWatchTransactions} for the selected wallet). Requires a streaming provider registered for the network — the hook exits silently with a console warning when none is configured.
 *
 * @param parameters - {@link UseWatchTransactionsByAddressParameters} Address, update callback and optional network override.
 *
 * @sample docs/examples/src/appkit/hooks/transaction#USE_WATCH_TRANSACTIONS_BY_ADDRESS
 *
 * @public
 * @category Hook
 * @section Transactions
 */
export const useWatchTransactionsByAddress = (parameters: UseWatchTransactionsByAddressParameters): void => {
    const { address, network } = parameters;
    const appKit = useAppKit();

    useEffect(() => {
        if (!address) return;

        const resolvedNetwork = resolveNetwork(appKit, network);
        if (!resolvedNetwork || !hasStreamingProvider(appKit, resolvedNetwork)) {
            // eslint-disable-next-line no-console
            console.warn(
                resolvedNetwork
                    ? `No streaming provider available for network: ${resolvedNetwork?.chainId}`
                    : 'No network provided',
            );

            return;
        }

        if (!parameters.onChange) {
            // eslint-disable-next-line no-console
            console.warn('No onChange callback provided for watchTransactionsByAddress');

            return;
        }

        return watchTransactionsByAddress(appKit, {
            ...parameters,
            address,
            network: resolvedNetwork,
            onChange: (update: TransactionsUpdate) => {
                parameters.onChange?.(update);
            },
        });
    }, [address, network, appKit, parameters]);
};
