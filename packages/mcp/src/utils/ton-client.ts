/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ApiClientToncenter, Network } from '@ton/walletkit';
import type { ApiClient } from '@ton/walletkit';

import type { TonNetwork } from '../registry/config.js';
import { setupProxySupport } from './proxy.js';

const DEFAULT_TONCENTER_API_KEYS: Record<TonNetwork, string> = {
    mainnet: 'c2de0a8e6e2628fcccf98b1ee23201fd1188c4e0dfd2c0bd2ad2bdb438d2adcd',
    testnet: 'ead1a3d90698628cfa5cc1ce7fd23b25f09913b80cc29fef4104adaa7e2550a7',
};
const API_CLIENT_INTERVAL_WITHOUT_KEY_MS = 1000;
const API_CLIENT_INTERVAL_WITH_KEY_MS = 200;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getToncenterEndpoint(network: TonNetwork): string {
    return network === 'mainnet' ? 'https://toncenter.com' : 'https://testnet.toncenter.com';
}

export function getApiClientRequestIntervalMs(apiKey?: string): number {
    return apiKey?.trim() ? API_CLIENT_INTERVAL_WITH_KEY_MS : API_CLIENT_INTERVAL_WITHOUT_KEY_MS;
}

export function resolveToncenterApiKey(network: TonNetwork, apiKey?: string): string {
    return apiKey?.trim() || DEFAULT_TONCENTER_API_KEYS[network];
}

export function createRateLimitedFetch(delayMs: number, fetchImpl: typeof fetch = fetch): typeof fetch {
    if (delayMs <= 0) {
        return fetchImpl;
    }

    let queue: Promise<void> = Promise.resolve();

    return async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> => {
        const request = queue.then(async () => {
            try {
                return await fetchImpl(input, init);
            } finally {
                await sleep(delayMs);
            }
        });

        queue = request.then(
            () => undefined,
            () => undefined,
        );

        return request;
    };
}

export function createApiClient(network: TonNetwork, apiKey?: string): ApiClient {
    setupProxySupport();

    const resolvedNetwork = network === 'mainnet' ? Network.mainnet() : Network.testnet();
    const resolvedApiKey = resolveToncenterApiKey(network, apiKey);

    return new ApiClientToncenter({
        endpoint: getToncenterEndpoint(network),
        network: resolvedNetwork,
        apiKey: resolvedApiKey,
        fetchApi: createRateLimitedFetch(getApiClientRequestIntervalMs(resolvedApiKey)),
    });
}
