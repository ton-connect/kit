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

import { useAppKit } from '../../../hooks/use-app-kit';

export type UseWatchTransactionsByAddressParameters = Partial<WatchTransactionsByAddressOptions>;

/**
 * Hook to watch transactions for a specific address in real-time.
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
