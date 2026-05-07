/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getJettons } from '@ton/appkit';

export const getJettonsExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_JETTONS
    const response = await getJettons(appKit);
    if (!response) {
        console.log('No wallet selected or no jettons found');
        return;
    }
    console.log('Jettons:', response.jettons.length);
    response.jettons.forEach((j) => console.log(`- ${j.info.name}: ${j.balance.toString()}`));
    // SAMPLE_END: GET_JETTONS
};
