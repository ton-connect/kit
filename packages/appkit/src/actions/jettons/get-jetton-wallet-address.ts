/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { UserFriendlyAddress } from '../../types/primitives';
import type { Network } from '../../types/network';
import { getJettonWalletAddressFromClient } from '../../utils';
import { resolveNetwork } from '../../utils/network/resolve-network';

/**
 * Options for {@link getJettonWalletAddress}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export interface GetJettonWalletAddressOptions {
    /** Jetton master contract address. */
    jettonAddress: UserFriendlyAddress;
    /** Owner whose jetton wallet should be derived. */
    ownerAddress: UserFriendlyAddress;
    /** Network to query. Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set. */
    network?: Network;
}

/**
 * Return type of {@link getJettonWalletAddress}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type GetJettonWalletAddressReturnType = UserFriendlyAddress;

/**
 * Derive the jetton-wallet address for a given owner — the per-owner contract that actually holds the jetton balance for `jettonAddress`.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetJettonWalletAddressOptions} Jetton master, owner address and optional network override.
 * @returns User-friendly address of the owner's jetton wallet.
 *
 * @sample docs/examples/src/appkit/actions/jettons#GET_JETTON_WALLET_ADDRESS
 * @expand options
 *
 * @public
 * @category Action
 * @section Jettons
 */
export const getJettonWalletAddress = async (
    appKit: AppKit,
    options: GetJettonWalletAddressOptions,
): Promise<GetJettonWalletAddressReturnType> => {
    const { jettonAddress, ownerAddress, network } = options;

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));

    return getJettonWalletAddressFromClient(client, jettonAddress, ownerAddress);
};
