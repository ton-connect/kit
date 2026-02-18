/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getBalanceByAddress } from '@ton/appkit';

export const getBalanceByAddressExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_BALANCE_BY_ADDRESS
    const balanceByAddress = await getBalanceByAddress(appKit, {
        address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Zero Address
    });
    console.log('Balance by address:', balanceByAddress.toString());
    // SAMPLE_END: GET_BALANCE_BY_ADDRESS
};
