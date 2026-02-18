/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { sendTransaction } from '@ton/appkit';

export const sendTransactionExample = async (appKit: AppKit) => {
    // SAMPLE_START: SEND_TRANSACTION
    const result = await sendTransaction(appKit, {
        messages: [
            {
                address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                amount: '100000000', // 0.1 TON in nanotons (raw format)
            },
        ],
    });

    console.log('Transaction Result:', result);
    // SAMPLE_END: SEND_TRANSACTION
};
