/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getJettons, getSelectedWallet } from '@ton/appkit';

// SAMPLE_START: APPKIT_FETCH_JETTONS
async function fetchJettons(appKit: AppKit) {
    const wallet = getSelectedWallet(appKit);
    if (!wallet) {
        throw new Error('No wallet connected');
    }

    // Fetch jetton balances
    const response = await getJettons(appKit, {
        address: wallet.getAddress(),
        network: wallet.getNetwork(),
        limit: 50,
        offset: 0,
    });

    // response.jettons is an array of Jetton objects
    for (const jetton of response.jettons) {
        console.log(`${jetton.info.name}: ${jetton.balance}`);
    }

    return response.jettons;
}
// SAMPLE_END: APPKIT_FETCH_JETTONS

export { fetchJettons };
