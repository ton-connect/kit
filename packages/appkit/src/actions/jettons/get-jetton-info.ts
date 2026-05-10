/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { JettonInfo } from '../../types/jetton';
import type { Network } from '../../types/network';
import type { UserFriendlyAddress } from '../../types/primitives';
import { resolveNetwork } from '../../utils/network/resolve-network';

/**
 * Options for {@link getJettonInfo}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export interface GetJettonInfoOptions {
    /** Jetton master contract address whose metadata is being fetched. */
    address: UserFriendlyAddress;
    /** Network to query. Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set. */
    network?: Network;
}

/**
 * Return type of {@link getJettonInfo} — `null` when the indexer has no record for that master address.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type GetJettonInfoReturnType = JettonInfo | null;

/**
 * Fetch token metadata for a jetton master — name, symbol, decimals, image and description as reported by the indexer; returns `null` when the indexer has no record for that master address.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetJettonInfoOptions} Jetton master address and optional network override.
 * @returns Jetton metadata, or `null` if the indexer has no record.
 *
 * @sample docs/examples/src/appkit/actions/jettons#GET_JETTON_INFO
 * @expand options
 *
 * @public
 * @category Action
 * @section Jettons
 */
export const getJettonInfo = async (
    appKit: AppKit,
    options: GetJettonInfoOptions,
): Promise<GetJettonInfoReturnType> => {
    const { address, network } = options;

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));

    const response = await client.jettonsByAddress({
        address: address,
        offset: 0,
        limit: 1,
    });

    if (!response.jetton_masters?.length || !response.jetton_masters[0]) {
        return null;
    }

    const jetton = response.jetton_masters[0];
    const metadata = response.metadata?.[jetton.address];
    const tokenInfo = metadata?.token_info?.find((t) => t.valid && t.type === 'jetton_masters') as
        | {
              name?: string;
              symbol?: string;
              description?: string;
              image?: string;
              extra?: { decimals?: string | number; uri?: string };
          }
        | undefined;

    let decimals: number | undefined;
    if (tokenInfo?.extra?.decimals !== undefined) {
        try {
            decimals =
                typeof tokenInfo.extra.decimals === 'string'
                    ? parseInt(tokenInfo.extra.decimals, 10)
                    : tokenInfo.extra.decimals;
        } catch {
            // ignore
        }
    }

    return {
        decimals,
        address: jetton.jetton,
        name: tokenInfo?.name ?? '',
        symbol: tokenInfo?.symbol ?? '',
        description: tokenInfo?.description ?? '',
        image: tokenInfo?.image,
        uri: tokenInfo?.extra?.uri,
    };
};
