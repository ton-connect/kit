/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getBalanceByAddress } from '@ton/appkit';

export const getBalanceExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_BALANCE_BY_ADDRESS
    const balance = await getBalanceByAddress(appKit, {
        address: 'UQ...', // Address to check
    });
    console.log('Balance:', balance.toString());
    // SAMPLE_END: GET_BALANCE_BY_ADDRESS
};
