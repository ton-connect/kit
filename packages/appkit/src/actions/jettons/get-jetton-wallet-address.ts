/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonWalletAddressFromClient } from '@ton/walletkit';

import type { UserFriendlyAddress } from '../../types/primitives';
import type { AppKit } from '../../core/app-kit';
import type { Network } from '../../types/network';
import { getCacheKey } from '../../core/cache';
import { isFriendlyTonAddress, resolveNetwork, toBounceableAddress } from '../../utils';

export interface GetJettonWalletAddressOptions {
    jettonAddress: UserFriendlyAddress;
    ownerAddress: UserFriendlyAddress;
    network?: Network;
}

export type GetJettonWalletAddressReturnType = UserFriendlyAddress;

const getJettonWalletCacheKey = getCacheKey('jetton-wallet-address');

export const getJettonWalletAddress = async (
    appKit: AppKit,
    options: GetJettonWalletAddressOptions,
): Promise<GetJettonWalletAddressReturnType> => {
    const ownerAddress = toBounceableAddress(options.ownerAddress);
    const jettonAddress = toBounceableAddress(options.jettonAddress);
    const network = resolveNetwork(appKit, options.network);

    const cacheKey = getJettonWalletCacheKey(network.chainId, ownerAddress, jettonAddress);

    const cached = await appKit.cache.get(cacheKey);
    if (cached && isFriendlyTonAddress(cached)) {
        return cached;
    }

    const client = appKit.networkManager.getClient(network);
    const jettonWalletAddress = await getJettonWalletAddressFromClient(client, jettonAddress, ownerAddress);
    await appKit.cache.set(cacheKey, jettonWalletAddress);

    return jettonWalletAddress;
};
