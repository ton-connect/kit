/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSwapProvider } from '@ton/appkit-react';

export const UseSwapProviderExample = () => {
    // SAMPLE_START: USE_SWAP_PROVIDER
    const [provider, setProviderId] = useSwapProvider();
    return (
        <div>
            <div>Result: {provider ? provider.providerId : 'null'}</div>
            <button onClick={() => setProviderId('stonfi')}>Use STON.fi</button>
        </div>
    );
    // SAMPLE_END: USE_SWAP_PROVIDER
};
