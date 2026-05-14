/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { signText } from '@ton/appkit';

export const signTextExample = async (appKit: AppKit) => {
    // SAMPLE_START: SIGN_TEXT
    const result = await signText(appKit, {
        text: 'Hello, TON!',
    });

    console.log('Signature:', result.signature);
    // SAMPLE_END: SIGN_TEXT
};
