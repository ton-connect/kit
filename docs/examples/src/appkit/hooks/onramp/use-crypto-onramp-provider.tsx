/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCryptoOnrampProvider } from '@ton/appkit-react';

export const UseCryptoOnrampProviderExample = () => {
    // SAMPLE_START: USE_CRYPTO_ONRAMP_PROVIDER
    const provider = useCryptoOnrampProvider({ id: 'layerswap' });

    return <div>Provider: {provider?.providerId}</div>;
    // SAMPLE_END: USE_CRYPTO_ONRAMP_PROVIDER
};
