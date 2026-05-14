/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCryptoOnrampProviders } from '@ton/appkit-react';

export const UseCryptoOnrampProvidersExample = () => {
    // SAMPLE_START: USE_CRYPTO_ONRAMP_PROVIDERS
    const providers = useCryptoOnrampProviders();

    return (
        <ul>
            {providers.map((p) => (
                <li key={p.providerId}>{p.providerId}</li>
            ))}
        </ul>
    );
    // SAMPLE_END: USE_CRYPTO_ONRAMP_PROVIDERS
};
