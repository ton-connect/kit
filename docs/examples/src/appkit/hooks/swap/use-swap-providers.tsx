/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSwapProviders } from '@ton/appkit-react';

export const UseSwapProvidersExample = () => {
    // SAMPLE_START: USE_SWAP_PROVIDERS
    const providers = useSwapProviders();
    return (
        <ul>
            {providers.map((p) => (
                <li key={p.providerId}>{p.getMetadata().name}</li>
            ))}
        </ul>
    );
    // SAMPLE_END: USE_SWAP_PROVIDERS
};
