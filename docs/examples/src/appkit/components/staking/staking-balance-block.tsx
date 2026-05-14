/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import { UnstakeMode } from '@ton/appkit';
import type { StakingProviderMetadata } from '@ton/appkit';
import { StakingBalanceBlock } from '@ton/appkit-react';

const tonstakersMetadata: StakingProviderMetadata = {
    name: 'Tonstakers',
    supportedUnstakeModes: [UnstakeMode.INSTANT, UnstakeMode.WHEN_AVAILABLE, UnstakeMode.ROUND_END],
    supportsReversedQuote: true,
    stakeToken: { ticker: 'TON', decimals: 9, address: 'ton' },
    receiveToken: { ticker: 'tsTON', decimals: 9, address: 'EQCkR1cGmnsE45N4TPDFhRdkA9oWFAFKzm0kQAcz2P0BJgY3' },
};

export const StakingBalanceBlockExample = () => {
    // SAMPLE_START: STAKING_BALANCE_BLOCK
    return (
        <StakingBalanceBlock
            providerMetadata={tonstakersMetadata}
            direction="stake"
            balance="12.5"
            onMaxClick={() => console.log('Use max balance')}
        />
    );
    // SAMPLE_END: STAKING_BALANCE_BLOCK
};
