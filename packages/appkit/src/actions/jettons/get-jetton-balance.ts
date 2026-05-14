/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getJettonBalanceFromClient, formatUnits } from '@ton/walletkit';
import type { TokenAmount, UserFriendlyAddress } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getJettonWalletAddress } from './get-jetton-wallet-address';
import { getJettonInfo } from './get-jetton-info';
import { isNumber, resolveNetwork } from '../../utils';
import type { Network } from '../../types/network';

export interface GetJettonBalanceOptions {
    jettonAddress: UserFriendlyAddress;
    ownerAddress: UserFriendlyAddress;
    jettonDecimals?: number;
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

    if (isNumber(jettonDecimals)) {
        return formatUnits(balance, jettonDecimals);
    }

    const jettonInfo = await getJettonInfo(appKit, { address: jettonAddress, network });

    return formatUnits(balance, jettonInfo?.decimals ?? 0);
};
