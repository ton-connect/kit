/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { createTransferTonTransaction } from '@ton/appkit';

export const createTransferTonTransactionExample = async (appKit: AppKit) => {
    // SAMPLE_START: CREATE_TRANSFER_TON_TRANSACTION
    const tx = await createTransferTonTransaction(appKit, {
        recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        amount: '0.1', // 0.1 TON
        comment: 'Draft transaction',
    });

    console.log('Transaction Request:', tx);
    // SAMPLE_END: CREATE_TRANSFER_TON_TRANSACTION
};
