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

/**
 * Options for {@link getJettonBalance}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export interface GetJettonBalanceOptions {
    /** Jetton master contract address (the token, not the user's wallet for it). */
    jettonAddress: UserFriendlyAddress;
    /** Owner of the jetton wallet — typically the connected user's address. */
    ownerAddress: UserFriendlyAddress;
    /** Decimals declared by the jetton master; used to format the raw balance into a human-readable string. */
    jettonDecimals: number;
    /** Network to read the balance from. Defaults to the connected wallet's network, or the configured default if no wallet is connected. */
    network?: Network;
}

/**
 * Return type of {@link getJettonBalance}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type GetJettonBalanceReturnType = TokenAmount;

/**
 * Read a jetton balance for a given owner — derives the owner's jetton-wallet address from the master, then fetches and formats the balance using the supplied decimals.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetJettonBalanceOptions} Jetton master, owner address, decimals and optional network override.
 * @returns Balance as a human-readable decimal string in the jetton's units.
 *
 * @sample docs/examples/src/appkit/actions/jettons#GET_JETTON_BALANCE
 * @expand options
 *
 * @public
 * @category Action
 * @section Jettons
 */
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
