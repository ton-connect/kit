/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit, Base64String } from '@ton/appkit';
import { signBinary } from '@ton/appkit';

export const signBinaryExample = async (appKit: AppKit) => {
    // SAMPLE_START: SIGN_BINARY
    // Example: sign "Hello" in base64
    const result = await signBinary(appKit, {
        bytes: 'SGVsbG8=' as Base64String,
    });

    console.log('Binary Signature:', result.signature);
    // SAMPLE_END: SIGN_BINARY
};
