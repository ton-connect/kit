/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { transferTon } from '@ton/appkit';

// SAMPLE_START: APPKIT_SEND_TON
async function sendTon(appKit: AppKit) {
    // Send TON using appkit action
    const result = await transferTon(appKit, {
        recipientAddress: 'EQC...recipient...',
        amount: (1n * 10n ** 9n).toString(), // 1 TON in nanotons
        comment: 'Payment for services',
    });

    console.log('Transaction sent:', result.boc);
}
// SAMPLE_END: APPKIT_SEND_TON

export { sendTon };
