/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getJettonBalance, getSelectedWallet } from '@ton/appkit';

export const getJettonBalanceExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_JETTON_BALANCE
    const selectedWallet = getSelectedWallet(appKit);
    if (!selectedWallet) {
        console.log('No wallet selected');
        return;
    }

    const balance = await getJettonBalance(appKit, {
        jettonAddress: 'EQDBE420tTQIkoWcZ9pEOTKY63WVmwyIl3hH6yWl0r_h51Tl',
        ownerAddress: selectedWallet.getAddress(),
        jettonDecimals: 6,
    });
    console.log('Jetton Balance:', balance.toString());
    // SAMPLE_END: GET_JETTON_BALANCE
};
