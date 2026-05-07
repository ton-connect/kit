/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useStakingProviderMetadata } from '@ton/appkit-react';

export const UseStakingProviderMetadataExample = () => {
    // SAMPLE_START: USE_STAKING_PROVIDER_METADATA
    const metadata = useStakingProviderMetadata();
    return <div>Receive Token: {metadata?.receiveToken?.ticker}</div>;
    // SAMPLE_END: USE_STAKING_PROVIDER_METADATA
};
