/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getSelectedWallet } from '@ton/appkit';

export const getSelectedWalletExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_SELECTED_WALLET
    const wallet = getSelectedWallet(appKit);

    if (wallet) {
        console.log('Selected wallet:', wallet.getWalletId());
        console.log('Address:', wallet.getAddress());
    }
    // SAMPLE_END: GET_SELECTED_WALLET
};
