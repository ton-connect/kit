/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonWalletAddressFromClient } from '@ton/walletkit';
import type { Network, UserFriendlyAddress } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils/network/resolve-network';

export interface GetJettonWalletAddressOptions {
    jettonAddress: UserFriendlyAddress;
    ownerAddress: UserFriendlyAddress;
    network?: Network;
}

export type GetJettonWalletAddressReturnType = UserFriendlyAddress;

export const getJettonWalletAddress = async (
    appKit: AppKit,
    options: GetJettonWalletAddressOptions,
): Promise<GetJettonWalletAddressReturnType> => {
    const { jettonAddress, ownerAddress, network } = options;

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));

    return getJettonWalletAddressFromClient(client, jettonAddress, ownerAddress);
};
