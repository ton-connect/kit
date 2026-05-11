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

import { useAppKit } from '../../settings';

/**
 * Parameters accepted by {@link useWatchJettonsByAddress} — same fields as {@link appkit:WatchJettonsByAddressOptions}, all optional so callers can render the hook before the address is known.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseWatchJettonsByAddressParameters = Partial<WatchJettonsByAddressOptions>;

/**
 * Subscribe to jetton-balance updates for an arbitrary owner address; updates flow into the TanStack Query cache so {@link useJettonsByAddress} and {@link useJettonBalanceByAddress} re-render automatically. Logs a warning and exits when no streaming provider is configured for the resolved network.
 *
 * @param parameters - {@link UseWatchJettonsByAddressParameters} Owner address, update callback and optional network override.
 *
 * @sample docs/examples/src/appkit/hooks/jettons#USE_WATCH_JETTONS_BY_ADDRESS
 *
 * @public
 * @category Hook
 * @section Jettons
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
