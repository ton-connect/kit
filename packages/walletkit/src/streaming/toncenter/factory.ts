/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingProviderFactory } from '../types';
import { TonCenterStreamingProvider } from './provider';
import type { TonCenterStreamingProviderConfig } from './provider';

export type TonCenterStreamingFactoryConfig = Omit<TonCenterStreamingProviderConfig, 'network' | 'listener'>;

export const createTonCenterStreamingProviderFactory =
    (config?: TonCenterStreamingFactoryConfig): StreamingProviderFactory =>
    ({ network, listener, getWatchers }) => {
        return new TonCenterStreamingProvider({ network, listener, getWatchers, ...config });
    };
