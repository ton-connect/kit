/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JettonInfo } from '@ton/walletkit';
import { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export interface GetJettonInfoOptions {
    address: string;
    network?: Network;
}

export type GetJettonInfoReturnType = JettonInfo | null;

export const getJettonInfo = async (
    appKit: AppKit,
    options: GetJettonInfoOptions,
): Promise<GetJettonInfoReturnType> => {
    const { address, network } = options;

    const client = appKit.networkManager.getClient(network ?? Network.mainnet());

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
