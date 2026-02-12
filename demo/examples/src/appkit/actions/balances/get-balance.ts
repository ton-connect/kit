/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getBalance } from '@ton/appkit';

export const getBalanceExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_BALANCE
    const balance = await getBalance(appKit);
    if (balance) {
        console.log('Balance:', balance.toString());
    }
    // SAMPLE_END: GET_BALANCE
};
