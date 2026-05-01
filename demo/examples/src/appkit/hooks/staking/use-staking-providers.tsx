/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useStakingProviders } from '@ton/appkit-react';

export const UseStakingProvidersExample = () => {
    // SAMPLE_START: USE_STAKING_PROVIDERS
    const providers = useStakingProviders();
    return (
        <ul>
            {providers.map((p) => (
                <li key={p.providerId}>{p.providerId}</li>
            ))}
        </ul>
    );
    // SAMPLE_END: USE_STAKING_PROVIDERS
};
