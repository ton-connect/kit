/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getCryptoOnrampProviders } from '@ton/appkit';

export const getCryptoOnrampProvidersExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_CRYPTO_ONRAMP_PROVIDERS
    const providers = getCryptoOnrampProviders(appKit);
    console.log(
        'Registered crypto onramp providers:',
        providers.map((p) => p.providerId),
    );
    // SAMPLE_END: GET_CRYPTO_ONRAMP_PROVIDERS
};
