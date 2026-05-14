/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import { useState } from 'react';
import { Network } from '@ton/appkit';
import type { StakingProvider } from '@ton/appkit';
import { StakingSettingsModal } from '@ton/appkit-react';

export const StakingSettingsModalExample = () => {
    const [open, setOpen] = useState(true);
    // SAMPLE_START: STAKING_SETTINGS_MODAL
    // Source `provider` and `providers` from `useStakingProvider` and
    // `useStakingProviders` in real usage — they refresh as providers register
    // through AppKit.
    const provider: StakingProvider | undefined = undefined;
    const providers: StakingProvider[] = [];
    return (
        <StakingSettingsModal
            open={open}
            onClose={() => setOpen(false)}
            provider={provider}
            providers={providers}
            onProviderChange={(id) => console.log('Switch to', id)}
            network={Network.mainnet()}
        />
    );
    // SAMPLE_END: STAKING_SETTINGS_MODAL
};
