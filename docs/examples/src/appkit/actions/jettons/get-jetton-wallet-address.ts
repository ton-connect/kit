/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getJettonWalletAddress, getSelectedWallet } from '@ton/appkit';

export const getJettonWalletAddressExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_JETTON_WALLET_ADDRESS
    const selectedWallet = getSelectedWallet(appKit);
    if (!selectedWallet) {
        console.log('No wallet selected');
        return;
    }

    const address = await getJettonWalletAddress(appKit, {
        jettonAddress: 'EQDBE420tTQIkoWcZ9pEOTKY63WVmwyIl3hH6yWl0r_h51Tl',
        ownerAddress: selectedWallet.getAddress(),
    });
    console.log('Jetton Wallet Address:', address);
    // SAMPLE_END: GET_JETTON_WALLET_ADDRESS
};
