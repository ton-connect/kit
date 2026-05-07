/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getBlockNumber } from '@ton/appkit';

export const getBlockNumberExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_BLOCK_NUMBER
    const blockNumber = await getBlockNumber(appKit);

    console.log('Current block number:', blockNumber);
    // SAMPLE_END: GET_BLOCK_NUMBER
};
