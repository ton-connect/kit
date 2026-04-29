/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit, CustomProvider } from '@ton/appkit';
import { getCustomProvider } from '@ton/appkit';

interface TacProvider extends CustomProvider {
    sendCrossChainTransaction: (params: unknown) => Promise<void>;
}

export const getCustomProviderExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_CUSTOM_PROVIDER
    const tac = getCustomProvider<TacProvider>(appKit, { id: 'tac' });

    if (tac) {
        console.log('TAC provider is available');
    }
    // SAMPLE_END: GET_CUSTOM_PROVIDER
};
