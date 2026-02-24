/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { createTransferJettonTransaction } from '@ton/appkit';

export const createTransferJettonTransactionExample = async (appKit: AppKit) => {
    // SAMPLE_START: CREATE_TRANSFER_JETTON_TRANSACTION
    const tx = await createTransferJettonTransaction(appKit, {
        jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        amount: '100', // 100 USDT
        comment: 'Hello Jetton',
        jettonDecimals: 6,
    });
    console.log('Transfer Transaction:', tx);
    // SAMPLE_END: CREATE_TRANSFER_JETTON_TRANSACTION
};
