/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { transferJetton } from '@ton/appkit';

export const transferJettonExample = async (appKit: AppKit) => {
    // SAMPLE_START: TRANSFER_JETTON
    const result = await transferJetton(appKit, {
        jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        amount: '100',
        jettonDecimals: 6,
    });
    console.log('Transfer Result:', result);
    // SAMPLE_END: TRANSFER_JETTON
};
