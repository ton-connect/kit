/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount, Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { getBalanceByAddress } from './get-balance-by-address';

export interface GetBalanceOptions {
    network?: Network;
}

export async function getBalance(appKit: AppKit, options: GetBalanceOptions = {}): Promise<TokenAmount | null> {
    const selectedWallet = getSelectedWallet(appKit);

    if (!selectedWallet) {
        return null;
    }

    return getBalanceByAddress(appKit, {
        address: selectedWallet.getAddress(),
        network: options.network,
    });
}
