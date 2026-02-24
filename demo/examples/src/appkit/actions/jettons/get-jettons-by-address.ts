/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getJettonsByAddress, getSelectedWallet } from '@ton/appkit';

export const getJettonsByAddressExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_JETTONS_BY_ADDRESS
    const selectedWallet = getSelectedWallet(appKit);
    if (!selectedWallet) {
        console.log('No wallet selected');
        return;
    }

    const response = await getJettonsByAddress(appKit, {
        address: selectedWallet.getAddress(),
    });
    console.log('Jettons by Address:', response.jettons.length);
    response.jettons.forEach((j) => console.log(`- ${j.info.name}: ${j.balance.toString()}`));
    // SAMPLE_END: GET_JETTONS_BY_ADDRESS
};
