/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { TokenAmount, UserFriendlyAddress } from '../../types/primitives';
import type { Network } from '../../types/network';
import { getJettonBalanceFromClient, formatUnits } from '../../utils';
import { resolveNetwork } from '../../utils/network/resolve-network';
import { getJettonWalletAddress } from './get-jetton-wallet-address';

export interface GetJettonBalanceOptions {
    jettonAddress: UserFriendlyAddress;
    ownerAddress: UserFriendlyAddress;
    jettonDecimals: number;
    network?: Network;
}

export type GetJettonBalanceReturnType = TokenAmount;

export const getJettonBalance = async (
    appKit: AppKit,
    options: GetJettonBalanceOptions,
): Promise<GetJettonBalanceReturnType> => {
    const { jettonAddress, ownerAddress, jettonDecimals, network } = options;

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));

    const jettonWalletAddress = await getJettonWalletAddress(appKit, {
        jettonAddress,
        ownerAddress,
        network,
    });
    const balance = await getJettonBalanceFromClient(client, jettonWalletAddress);

    return formatUnits(balance, jettonDecimals);
};
