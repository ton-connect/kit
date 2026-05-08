/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import type { AppKit } from '../../core/app-kit';
import type { Jetton, JettonsResponse } from '../../types/jetton';
import type { Network } from '../../types/network';
import type { UserFriendlyAddress } from '../../types/primitives';
import { getJettonsFromClient, formatUnits } from '../../utils';
import { resolveNetwork } from '../../utils/network/resolve-network';

/**
 * Options for {@link getJettonsByAddress}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export interface GetJettonsByAddressOptions {
    /** Owner address — pass a {@link UserFriendlyAddress} string or an `Address` instance from `@ton/core`. */
    address: UserFriendlyAddress | Address;
    /** Network to read the jettons from. Defaults to the connected wallet's network, or the configured default if no wallet is connected. */
    network?: Network;
    /** Maximum number of jettons to return. */
    limit?: number;
    /** Number of jettons to skip before returning results — used for pagination. */
    offset?: number;
}

/**
 * Return type of {@link getJettonsByAddress}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type GetJettonsByAddressReturnType = JettonsResponse;

/**
 * List jettons held by an arbitrary address — useful for inspecting wallets that aren't selected in AppKit (use {@link getJettons} for the selected wallet); raw balances are formatted with each jetton's declared decimals, and entries without decimals are dropped.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetJettonsByAddressOptions} Owner address, optional network override and pagination.
 * @returns Jettons response with formatted balances.
 *
 * @sample docs/examples/src/appkit/actions/jettons#GET_JETTONS_BY_ADDRESS
 * @expand options
 *
 * @public
 * @category Action
 * @section Jettons
 */
export const getJettonsByAddress = async (
    appKit: AppKit,
    options: GetJettonsByAddressOptions,
): Promise<GetJettonsByAddressReturnType> => {
    const { address, network, limit, offset } = options;
    const addressString = Address.isAddress(address) ? address.toString() : Address.parse(address).toString();

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));
    const response = await getJettonsFromClient(client, addressString, {
        pagination: {
            limit,
            offset,
        },
    });

    const jettons = response.jettons.reduce((acc, jetton) => {
        if (!jetton.decimalsNumber) {
            return acc;
        }

        acc.push({
            ...jetton,
            balance: formatUnits(jetton.balance, jetton.decimalsNumber),
        });
        return acc;
    }, [] as Jetton[]);

    return {
        ...response,
        jettons,
    };
};
