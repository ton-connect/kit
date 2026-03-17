/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createRateLimitedFetch, getApiClientRequestIntervalMs, resolveToncenterApiKey } from '../utils/ton-client.js';

describe('ton-client helpers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('uses 1000ms without key and 200ms with key', () => {
        expect(getApiClientRequestIntervalMs()).toBe(1000);
        expect(getApiClientRequestIntervalMs('')).toBe(1000);
        expect(getApiClientRequestIntervalMs('api-key')).toBe(200);
        expect(getApiClientRequestIntervalMs('  api-key  ')).toBe(200);
    });

    it('falls back to built-in Toncenter keys for both networks', () => {
        expect(resolveToncenterApiKey('mainnet')).toBe(
            'c2de0a8e6e2628fcccf98b1ee23201fd1188c4e0dfd2c0bd2ad2bdb438d2adcd',
        );
        expect(resolveToncenterApiKey('testnet')).toBe(
            'ead1a3d90698628cfa5cc1ce7fd23b25f09913b80cc29fef4104adaa7e2550a7',
        );
        expect(resolveToncenterApiKey('mainnet', 'custom-key')).toBe('custom-key');
    });

    it('serializes fetch calls and waits between them', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
        const rateLimitedFetch = createRateLimitedFetch(1000, fetchMock);

        const firstRequest = rateLimitedFetch('https://example.com/first');
        await Promise.resolve();

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const secondRequest = rateLimitedFetch('https://example.com/second');
        await Promise.resolve();

        expect(fetchMock).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(999);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(1000);
        await expect(firstRequest).resolves.toBeInstanceOf(Response);
        await expect(secondRequest).resolves.toBeInstanceOf(Response);
    });
});
