/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getJettonInfo } from '@ton/appkit';

export const getJettonInfoExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_JETTON_INFO
    const info = await getJettonInfo(appKit, {
        address: 'EQDBE420tTQIkoWcZ9pEOTKY63WVmwyIl3hH6yWl0r_h51Tl',
    });
    console.log('Jetton Info:', info);
    // SAMPLE_END: GET_JETTON_INFO
};
