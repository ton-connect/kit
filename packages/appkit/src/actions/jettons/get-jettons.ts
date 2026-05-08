/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { JettonsResponse } from '../../types/jetton';
import type { Network } from '../../types/network';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { getJettonsByAddress } from './get-jettons-by-address';

export interface GetJettonsOptions {
    network?: Network;
    limit?: number;
    offset?: number;
}

export type GetJettonsReturnType = JettonsResponse | null;

export const getJettons = async (appKit: AppKit, options: GetJettonsOptions = {}): Promise<GetJettonsReturnType> => {
    const selectedWallet = getSelectedWallet(appKit);

    if (!selectedWallet) {
        return null;
    }

    return getJettonsByAddress(appKit, {
        address: selectedWallet.getAddress(),
        network: options.network,
        limit: options.limit,
        offset: options.offset,
    });
};
