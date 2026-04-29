/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JettonInfo } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { toBounceableAddress, resolveNetwork, isJettonInfo } from '../../utils';
import type { Network } from '../../types/network';
import { getCacheKey } from '../../core/cache';

export interface GetJettonInfoOptions {
    address: string;
    network?: Network;
}

export type GetJettonInfoReturnType = JettonInfo | null;

const getJettonInfoCacheKey = getCacheKey('jetton-info');

export const getJettonInfo = async (
    appKit: AppKit,
    options: GetJettonInfoOptions,
): Promise<GetJettonInfoReturnType> => {
    const address = toBounceableAddress(options.address);
    const network = resolveNetwork(appKit, options.network);
    const cacheKey = getJettonInfoCacheKey(address, network.chainId);

    const cached = appKit.cache.get(cacheKey);
    if (cached && isJettonInfo(cached)) return cached;

    const client = appKit.networkManager.getClient(network);

    const response = await client.jettonsByAddress({
        address,
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

    const result: GetJettonInfoReturnType = {
        address,
        decimals,
        name: tokenInfo?.name ?? '',
        symbol: tokenInfo?.symbol ?? '',
        description: tokenInfo?.description ?? '',
        image: tokenInfo?.image,
        uri: tokenInfo?.extra?.uri,
    };

    appKit.cache.set(cacheKey, result);
    return result;
};
