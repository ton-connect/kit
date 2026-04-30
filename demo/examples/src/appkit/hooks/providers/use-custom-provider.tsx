/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CustomProvider } from '@ton/appkit';
import { useCustomProvider } from '@ton/appkit-react';

interface TacProvider extends CustomProvider {
    sendCrossChainTransaction: (params: unknown) => Promise<void>;
}

export const UseCustomProviderExample = () => {
    // SAMPLE_START: USE_CUSTOM_PROVIDER
    const tac = useCustomProvider<TacProvider>('tac');

    if (!tac) {
        return <div>TAC provider not registered</div>;
    }

    return <div>TAC provider is ready</div>;
    // SAMPLE_END: USE_CUSTOM_PROVIDER
};
