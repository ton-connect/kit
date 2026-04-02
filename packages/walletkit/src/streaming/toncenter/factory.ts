/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingProviderFactory } from '../../api/interfaces';
import { TonCenterStreamingProvider } from './provider';
import type { TonCenterStreamingProviderConfig } from './models';

export type TonCenterStreamingFactoryConfig = TonCenterStreamingProviderConfig;

export const createTonCenterStreamingProvider =
    (config: TonCenterStreamingFactoryConfig): StreamingProviderFactory =>
    (ctx) => {
        return new TonCenterStreamingProvider(ctx, config);
    };
