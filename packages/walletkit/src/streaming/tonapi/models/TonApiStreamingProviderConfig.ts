/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../../api/models';

/**
 * Configuration options for the TonAPI streaming provider (v2 WebSocket protocol).
 */
export interface TonApiStreamingProviderConfig {
    network: Network;
    /**
     * Full WebSocket URL for the streaming API. When set, it is used as-is (after http→wss normalization).
     * When omitted, the default TonAPI host for the network is used with `/api/streaming/v2/ws`.
     */
    endpoint?: string;
    /**
     * Optional bearer token for TonAPI (`token` query parameter on the WebSocket URL).
     */
    apiKey?: string;
}
