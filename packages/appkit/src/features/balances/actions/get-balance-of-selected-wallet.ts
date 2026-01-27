/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount, Network } from '@ton/walletkit';

import type { AppKit } from '../../../core/app-kit';
import { getBalance } from './get-balance';

export interface GetBalanceOfSelectedWalletOptions {
    network?: Network;
}

export async function getBalanceOfSelectedWallet(
    appKit: AppKit,
    options: GetBalanceOfSelectedWalletOptions = {},
): Promise<TokenAmount | null> {
    const selectedWallet = appKit.walletsManager.selectedWallet;

    if (!selectedWallet) {
        return null;
    }

    return getBalance(appKit, {
        address: selectedWallet.getAddress(),
        network: options.network,
    });
}
