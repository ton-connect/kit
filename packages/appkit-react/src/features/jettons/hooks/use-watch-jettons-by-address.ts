/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { watchJettonsByAddress, hasStreamingProvider, resolveNetwork } from '@ton/appkit';
import type { WatchJettonsByAddressOptions, JettonUpdate } from '@ton/appkit';
import { handleJettonBalanceUpdate, handleJettonsUpdate } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';

export type UseWatchJettonsByAddressParameters = Partial<WatchJettonsByAddressOptions>;

/**
 * Hook to watch jetton updates for a specific address in real-time.
 * Automatically updates TanStack Query caches for jetton balances.
 */
export const useWatchJettonsByAddress = (parameters: UseWatchJettonsByAddressParameters): void => {
    const { address, network } = parameters;
    const appKit = useAppKit();
    const queryClient = useQueryClient();

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

        const addressString = address.toString();

        return watchJettonsByAddress(appKit, {
            ...parameters,
            address,
            network: resolvedNetwork,
            onChange: (update: JettonUpdate) => {
                parameters.onChange?.(update);

                handleJettonsUpdate(queryClient, { address: addressString, network: resolvedNetwork }, update);

                handleJettonBalanceUpdate(
                    queryClient,
                    {
                        ownerAddress: addressString,
                        jettonAddress: update.masterAddress,
                        network: resolvedNetwork,
                    },
                    update,
                );
            },
        });
    }, [address, network, appKit, queryClient, parameters]);
};
