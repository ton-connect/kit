/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '../../api/models';
import type { ProviderFactoryContext } from '../../types/factory';
import { STREAMING_V2_WS_PATH, TonStreamingV2BaseProvider } from '../TonStreamingV2BaseProvider';
import type { TonCenterStreamingProviderConfig } from './models';

/**
 * Toncenter-specific implementation of StreamingProvider.
 * Manages a single WebSocket connection and reports account updates.
 */
export class TonCenterStreamingProvider extends TonStreamingV2BaseProvider {
    public readonly network: Network;

    constructor(_ctx: ProviderFactoryContext, config: TonCenterStreamingProviderConfig) {
        const base =
            config.endpoint ??
            (config.network.chainId === Network.mainnet().chainId
                ? 'wss://toncenter.com'
                : 'wss://testnet.toncenter.com');

        const baseUrl = base.replace(/\/$/, '').replace(/^https?/, 'wss') + STREAMING_V2_WS_PATH;

        super(_ctx, {
            providerId: `toncenter-${config.network.chainId}`,
            baseUrl,
            authQueryParam: 'api_key',
            authSecret: config.apiKey,
        });

        this.network = config.network;
    }
}
