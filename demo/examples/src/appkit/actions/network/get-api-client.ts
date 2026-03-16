/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getApiClient, Network } from '@ton/appkit';
import type { AppKit } from '@ton/appkit';

export const getApiClientExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_API_CLIENT
    const apiClient = getApiClient(appKit, {
        network: Network.mainnet(),
    });

    console.log('API Client:', apiClient);
    // SAMPLE_END: GET_API_CLIENT
};
