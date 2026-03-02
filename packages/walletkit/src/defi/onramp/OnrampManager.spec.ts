/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { vi } from 'vitest';

import { OnrampManager } from './OnrampManager';
import { OnrampProvider } from './OnrampProvider';
import { OnrampError } from './errors';

class MockProvider extends OnrampProvider {
    readonly providerId = 'mock_provider';

    async getQuote() {
        return {
            fiatCurrency: 'USD',
            cryptoCurrency: 'TON',
            fiatAmount: '100',
            cryptoAmount: '45',
            rate: '0.45',
            providerId: this.providerId,
        };
    }

    async getLimits() {
        return {
            minBaseAmount: 10,
            maxBaseAmount: 1000,
            providerId: this.providerId,
        };
    }

    async getTransactionStatus() {
        return {
            status: 'completed' as const,
            rawStatus: 'completed',
            transactionId: 'tx_123',
            fiatCurrency: 'usd',
            fiatAmount: '100',
            cryptoCurrency: 'ton',
            providerId: this.providerId,
        };
    }

    async buildOnrampUrl() {
        return 'https://mock.com/buy';
    }
}

describe('OnrampManager', () => {
    let manager: OnrampManager;
    let mockProvider: MockProvider;

    beforeEach(() => {
        manager = new OnrampManager();
        mockProvider = new MockProvider();
    });

    describe('registration', () => {
        it('should successfully register a provider', () => {
            manager.registerProvider(mockProvider);
            expect(manager.hasProvider('mock_provider')).toBe(true);
            expect(manager.getRegisteredProviders()).toContain('mock_provider');
        });

        it('should set the first registered provider as default', () => {
            manager.registerProvider(mockProvider);
            expect(manager.getProvider()).toBe(mockProvider);
        });

        it('should allow setting a default provider', () => {
            const anotherMock = new MockProvider();
            // @ts-ignore
            anotherMock.providerId = 'another_mock';

            manager.registerProvider(mockProvider);
            manager.registerProvider(anotherMock);

            manager.setDefaultProvider('another_mock');
            expect(manager.getProvider()).toBe(anotherMock);
        });

        it('should throw if setting unknown default provider', () => {
            expect(() => manager.setDefaultProvider('unknown')).toThrow(OnrampError);
        });
    });

    describe('delegation', () => {
        beforeEach(() => {
            manager.registerProvider(mockProvider);
        });

        it('should delegate getQuote to the provider', async () => {
            const spy = vi.spyOn(mockProvider, 'getQuote');
            const quote = await manager.getQuote({
                amount: '100',
                fiatCurrency: 'USD',
                cryptoCurrency: 'TON',
                network: 'mainnet',
            });

            expect(spy).toHaveBeenCalled();
            expect(quote.providerId).toBe('mock_provider');
        });

        it('should delegate getLimits to the provider', async () => {
            const spy = vi.spyOn(mockProvider, 'getLimits');
            const limits = await manager.getLimits({
                fiatCurrency: 'USD',
                cryptoCurrency: 'TON',
            });

            expect(spy).toHaveBeenCalled();
            expect(limits.providerId).toBe('mock_provider');
        });

        it('should delegate getTransactionStatus to the provider', async () => {
            const spy = vi.spyOn(mockProvider, 'getTransactionStatus');
            const status = await manager.getTransactionStatus({
                transactionId: '123',
            });

            expect(spy).toHaveBeenCalled();
            expect(status.providerId).toBe('mock_provider');
        });

        it('should delegate buildOnrampUrl to the provider', async () => {
            const spy = vi.spyOn(mockProvider, 'buildOnrampUrl');
            const url = await manager.buildOnrampUrl({
                userAddress: 'test_address',
            });

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('https://mock.com/buy');
        });
    });
});
