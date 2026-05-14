/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { registerProvider } from '@ton/appkit';
import { createOmnistonProvider } from '@ton/walletkit/swap/omniston';

export const registerProviderExample = (appKit: AppKit) => {
    // SAMPLE_START: REGISTER_PROVIDER
    registerProvider(
        appKit,
        createOmnistonProvider({
            defaultSlippageBps: 100, // 1%
        }),
    );
    // SAMPLE_END: REGISTER_PROVIDER
};
