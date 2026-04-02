/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingProviderFactory } from '../../api/interfaces';
import { TonApiStreamingProvider } from './provider';
import type { TonApiStreamingProviderConfig } from './models';

export type TonApiStreamingFactoryConfig = TonApiStreamingProviderConfig;

export const createTonApiStreamingProvider =
    (config: TonApiStreamingFactoryConfig): StreamingProviderFactory =>
    (ctx) => {
        return new TonApiStreamingProvider(ctx, config);
    };
