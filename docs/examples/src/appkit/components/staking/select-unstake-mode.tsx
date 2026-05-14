/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { UnstakeMode } from '@ton/appkit';
import type { StakingProviderMetadata, UnstakeModes } from '@ton/appkit';
import { SelectUnstakeMode } from '@ton/appkit-react';

const tonstakersMetadata: StakingProviderMetadata = {
    name: 'Tonstakers',
    supportedUnstakeModes: [UnstakeMode.INSTANT, UnstakeMode.WHEN_AVAILABLE, UnstakeMode.ROUND_END],
    supportsReversedQuote: true,
    stakeToken: { ticker: 'TON', decimals: 9, address: 'ton' },
};

export const SelectUnstakeModeExample = () => {
    const [mode, setMode] = useState<UnstakeModes>(UnstakeMode.INSTANT);
    // SAMPLE_START: SELECT_UNSTAKE_MODE
    return (
        <SelectUnstakeMode
            value={mode}
            onValueChange={setMode}
            providerMetadata={tonstakersMetadata}
            providerInfo={undefined}
        />
    );
    // SAMPLE_END: SELECT_UNSTAKE_MODE
};
