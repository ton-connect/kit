/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { watchBalanceByAddress } from '@ton/appkit';

export const watchBalanceByAddressExample = (appKit: AppKit) => {
    // SAMPLE_START: WATCH_BALANCE_BY_ADDRESS
    const unsubscribe = watchBalanceByAddress(appKit, {
        address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        onChange: (update) => {
            console.log('Balance by address updated:', update.balance);
        },
    });

    // Later: unsubscribe();
    // SAMPLE_END: WATCH_BALANCE_BY_ADDRESS

    return unsubscribe;
};
