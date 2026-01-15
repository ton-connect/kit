/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi } from 'vitest';
import { Address } from '@ton/core';

import { OmnistonSwapProvider } from './OmnistonSwapProvider';
import { Network } from '../../../api/models';
import type { NetworkManager } from '../../../core/NetworkManager';
import type { EventEmitter } from '../../../core/EventEmitter';
import { isOmnistonQuoteMetadata } from './utils';

// Skip integration tests
describe('OmnistonSwapProvider.getQuote', () => {
    let mockNetworkManager: NetworkManager = {} as NetworkManager;
    let mockEventEmitter = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    } as unknown as EventEmitter;
    const provider = new OmnistonSwapProvider(mockNetworkManager, mockEventEmitter, {
        defaultSlippageBps: 100,
        quoteTimeoutMs: 30000,
    });
    const usdtQuoteParams = {
        fromToken: 'TON',
        toToken: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO', // USDT
        amount: '1000000000', // 1 TON
        network: Network.mainnet(),
    };

    it('should return quote for TON to USDT swap', async () => {
        const quote = await provider.getQuote(usdtQuoteParams);

        expect(BigInt(quote.toAmount)).toBeGreaterThan(0);
        expect(isOmnistonQuoteMetadata(quote.metadata)).toBeTruthy();
        expect(mockEventEmitter.emit).toHaveBeenCalledWith('swap:quote:received', expect.any(Object));
    }, 30000);

    it('should build tx for quote', async () => {
        const quote = await provider.getQuote(usdtQuoteParams);
        const randomBytes = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
        const randomAddress = Address.parseRaw(`0:${randomBytes.toString('hex')}`);
        const userAddress = randomAddress.toString();
        const tx = await provider.buildSwapTransaction({
            quote,
            userAddress,
        });

        expect(tx).toBeDefined();
        expect(tx.messages).toBeDefined();
        expect(Array.isArray(tx.messages)).toBe(true);
        expect(tx.messages.length).toBeGreaterThan(0);

        tx.messages.forEach((msg) => {
            expect(msg.address).toBeDefined();
            expect(typeof msg.address).toBe('string');
            expect(msg.address.length).toBeGreaterThan(0);
            expect(msg.amount).toBeDefined();
            expect(typeof msg.amount).toBe('string');
            expect(BigInt(msg.amount)).toBeGreaterThanOrEqual(0n);
        });

        if (tx.validUntil) {
            expect(typeof tx.validUntil).toBe('number');
            expect(tx.validUntil).toBeGreaterThan(Date.now() / 1000);
        }

        if (tx.network) {
            expect(tx.network).toBeDefined();
        }
    }, 30000);
});
