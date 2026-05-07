/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/appkit';
import type { AppKit } from '@ton/appkit';
import { hasStreamingProvider } from '@ton/appkit';

export const hasStreamingProviderExample = (appKit: AppKit) => {
    // SAMPLE_START: HAS_STREAMING_PROVIDER
    const isSupported = hasStreamingProvider(appKit, Network.mainnet());
    console.log('Mainnet streaming support:', isSupported);
    // SAMPLE_END: HAS_STREAMING_PROVIDER
};
