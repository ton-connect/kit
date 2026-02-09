/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getBalance, getJettons } from '@ton/appkit';

// Usage example for getting balance
export const getBalanceExample = async (appKit: AppKit) => {
    // get balance of the selected wallet
    // Note: getBalance requires an address, so this example assumes we have one
    const balance = await getBalance(appKit, { address: 'UQ...' });
    console.log('Balance:', balance);
};

// Usage example for getting jettons
export const getJettonsExample = async (appKit: AppKit) => {
    // get jettons of a specific address
    const jettons = await getJettons(appKit, { address: 'UQ...' });
    console.log('Jettons:', jettons);
};
