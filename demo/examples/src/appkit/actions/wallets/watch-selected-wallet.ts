/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { watchSelectedWallet } from '@ton/appkit';

export const watchSelectedWalletExample = (appKit: AppKit) => {
    // SAMPLE_START: WATCH_SELECTED_WALLET
    const unsubscribe = watchSelectedWallet(appKit, {
        onChange: (wallet) => {
            if (wallet) {
                console.log('Selected wallet changed:', wallet.getWalletId());
            } else {
                console.log('Wallet deselected');
            }
        },
    });

    // Later: unsubscribe();
    // SAMPLE_END: WATCH_SELECTED_WALLET
    return unsubscribe;
};
