/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '../../api/models';
import type { ProviderFactoryContext } from '../../types/factory';
import { TonStreamingV2BaseProvider } from '../TonStreamingV2BaseProvider';
import type { TonApiStreamingProviderConfig } from './models';

export const TONAPI_STREAMING_V2_WS_PATH = '/streaming/v2/ws';

function defaultTonApiWsOrigin(network: Network): string {
    switch (network.chainId) {
        case Network.mainnet().chainId:
            return 'wss://tonapi.io';
        case Network.tetra().chainId:
            return 'wss://tetra.tonapi.io';
        default:
            return 'wss://testnet.tonapi.io';
    }
}

/**
 * TonAPI implementation of StreamingProvider using the same v2 WebSocket protocol as Toncenter.
 */
export class TonApiStreamingProvider extends TonStreamingV2BaseProvider {
    public readonly network: Network;

    constructor(_ctx: ProviderFactoryContext, config: TonApiStreamingProviderConfig) {
        const normalized = (url: string) => url.replace(/\/$/, '').replace(/^https?/, 'wss');
        const baseUrl = config.endpoint
            ? normalized(config.endpoint)
            : normalized(defaultTonApiWsOrigin(config.network)) + TONAPI_STREAMING_V2_WS_PATH;

        super(_ctx, {
            providerId: `tonapi-${config.network.chainId}`,
            baseUrl,
            authQueryParam: 'token',
            authSecret: config.apiKey,
        });

        this.network = config.network;
    }
}
