/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { transferTon } from '@ton/appkit';

export const transferTonExample = async (appKit: AppKit) => {
    // SAMPLE_START: TRANSFER_TON
    const result = await transferTon(appKit, {
        recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        amount: '0.1', // 0.1 TON (human-readable format)
        comment: 'Hello from AppKit!',
    });

    console.log('Transfer Result:', result);
    // SAMPLE_END: TRANSFER_TON
};
