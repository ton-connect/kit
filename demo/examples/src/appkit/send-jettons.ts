/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { transferJetton } from '@ton/appkit';

// SAMPLE_START: APPKIT_SEND_JETTONS
async function sendJettons(appKit: AppKit) {
    // Send Jettons using appkit action
    const result = await transferJetton(appKit, {
        recipientAddress: 'EQC...recipient...',
        jettonAddress: 'EQD...jetton-master...',
        amount: '1000000000', // raw amount per token decimals
        comment: 'Jetton payment',
    });

    console.log('Jetton transfer sent:', result.boc);
}
// SAMPLE_END: APPKIT_SEND_JETTONS

export { sendJettons };
