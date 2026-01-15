/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi } from 'vitest';

import { OmnistonSwapProvider } from './OmnistonSwapProvider';
import { Network } from '../../../api/models';
import type { NetworkManager } from '../../../core/NetworkManager';
import type { EventEmitter } from '../../../core/EventEmitter';
import { isOmnistonQuoteMetadata } from './utils';

// Skip integration tests
describe.skip('OmnistonSwapProvider.getQuote', () => {
    let mockNetworkManager: NetworkManager = {} as NetworkManager;
    let mockEventEmitter = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    } as unknown as EventEmitter;

    it('should return quote for TON to USDT swap', async () => {
        const provider = new OmnistonSwapProvider(mockNetworkManager, mockEventEmitter, {
            defaultSlippageBps: 100,
            quoteTimeoutMs: 30000,
        });

        const quote = await provider.getQuote({
            fromToken: 'TON',
            toToken: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO', // USDT
            amount: '1000000000', // 1 TON
            network: Network.mainnet(),
        });

        expect(BigInt(quote.toAmount)).toBeGreaterThan(0);
        expect(isOmnistonQuoteMetadata(quote.metadata)).toBeTruthy();
        expect(mockEventEmitter.emit).toHaveBeenCalledWith('swap:quote:received', expect.any(Object));
    }, 30000);
});
