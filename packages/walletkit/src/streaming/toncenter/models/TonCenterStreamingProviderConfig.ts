/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../../api/models';

/**
 * Configuration options for the TonCenter streaming provider.
 */
export interface TonCenterStreamingProviderConfig {
    network: Network;
    /**
     * Optional custom WebSocket endpoint URL for the TonCenter v2 streaming API.
     * If omitted, it defaults to the official mainnet or testnet URL based on the network context.
     */
    endpoint?: string;
    /**
     * Optional API key for authenticating requests to TonCenter.
     * Highly recommended to avoid rate limiting on the streaming endpoint.
     */
    apiKey?: string;
}
