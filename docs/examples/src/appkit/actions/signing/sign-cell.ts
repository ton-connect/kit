/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit, Base64String } from '@ton/appkit';
import { signCell } from '@ton/appkit';

export const signCellExample = async (appKit: AppKit) => {
    // SAMPLE_START: SIGN_CELL
    const result = await signCell(appKit, {
        cell: 'te6ccgEBAQEAAgAAGA==' as Base64String, // Example BOC
        schema: 'transfer#abc123 amount:uint64 = Transfer',
    });

    console.log('Cell Signature:', result.signature);
    // SAMPLE_END: SIGN_CELL
};
