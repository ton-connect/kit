/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network, getJettonBalanceFromClient } from '@ton/walletkit';
import type { TokenAmount, UserFriendlyAddress } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getJettonWalletAddress } from './get-jetton-wallet-address';

export interface GetJettonBalanceOptions {
    jettonAddress: UserFriendlyAddress;
    ownerAddress: UserFriendlyAddress;
    network?: Network;
}

export type GetJettonBalanceReturnType = TokenAmount;

export const getJettonBalance = async (
    appKit: AppKit,
    options: GetJettonBalanceOptions,
): Promise<GetJettonBalanceReturnType> => {
    const { jettonAddress, ownerAddress, network } = options;

    const client = appKit.networkManager.getClient(network ?? Network.mainnet());

    const jettonWalletAddress = await getJettonWalletAddress(appKit, {
        jettonAddress,
        ownerAddress,
        network,
    });

    return getJettonBalanceFromClient(client, jettonWalletAddress);
};
