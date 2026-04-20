/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { signMessage } from '@ton/appkit';

export const signMessageExample = async (appKit: AppKit) => {
    // SAMPLE_START: SIGN_MESSAGE
    const result = await signMessage(appKit, {
        messages: [
            {
                address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                amount: '100000000', // 0.1 TON in nanotons
            },
        ],
    });

    // result.internalBoc is a signed internal message BoC (base64)
    // that can be relayed on-chain by a third party (e.g. a gasless relayer).
    console.log('Signed Message:', result);
    // SAMPLE_END: SIGN_MESSAGE
};
