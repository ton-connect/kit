/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useStakingProvider } from '@ton/appkit-react';

export const UseStakingProviderExample = () => {
    // SAMPLE_START: USE_STAKING_PROVIDER
    const provider = useStakingProvider({ id: 'tonstakers' });
    return <div>Result: {provider ? provider.providerId : 'null'}</div>;
    // SAMPLE_END: USE_STAKING_PROVIDER
};
