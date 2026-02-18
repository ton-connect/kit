/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { registerProvider } from '@ton/appkit';
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';

export const registerProviderExample = (appKit: AppKit) => {
    // SAMPLE_START: REGISTER_PROVIDER
    const omnistonProvider = new OmnistonSwapProvider({
        defaultSlippageBps: 100, // 1%
    });

    registerProvider(appKit, omnistonProvider);
    // SAMPLE_END: REGISTER_PROVIDER
};
