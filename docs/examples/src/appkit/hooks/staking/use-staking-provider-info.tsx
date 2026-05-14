/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useStakingProviderInfo } from '@ton/appkit-react';

export const UseStakingProviderInfoExample = () => {
    // SAMPLE_START: USE_STAKING_PROVIDER_INFO
    const { data: info, isLoading } = useStakingProviderInfo({
        providerId: 'tonstakers',
    });

    if (isLoading) return <div>Loading info...</div>;

    return <div>APY: {info?.apy}</div>;
    // SAMPLE_END: USE_STAKING_PROVIDER_INFO
};
