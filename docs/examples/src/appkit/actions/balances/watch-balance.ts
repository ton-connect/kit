/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { watchBalance } from '@ton/appkit';

export const watchBalanceExample = (appKit: AppKit) => {
    // SAMPLE_START: WATCH_BALANCE
    const unsubscribe = watchBalance(appKit, {
        onChange: (update) => {
            console.log('Balance updated:', update.balance);
        },
    });

    // Later: unsubscribe();
    // SAMPLE_END: WATCH_BALANCE

    return unsubscribe;
};
