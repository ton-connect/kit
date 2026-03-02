/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { vi } from 'vitest';

import { MoonpayProvider } from './MoonpayProvider';
import { OnrampError } from '../errors';
import { Network } from '../../../api/models';

describe('MoonpayProvider', () => {
    let provider: MoonpayProvider;
    const apiKey = 'test_api_key';

    beforeEach(() => {
        provider = new MoonpayProvider(apiKey);
        vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should throw if apiKey is not provided', () => {
            expect(() => new MoonpayProvider('')).toThrow(OnrampError);
        });

        it('should initialize successfully with an api key', () => {
            const validProvider = new MoonpayProvider(apiKey);
            expect(validProvider.providerId).toBe('moonpay');
            expect(validProvider.type).toBe('onramp');
        });
    });

    describe('getQuote', () => {
        it('should fetch and return a quote successfully', async () => {
            const mockResponse = {
                quoteCurrencyAmount: 45,
                quoteCurrencyPrice: 0.45,
                feeAmount: 2,
                networkFeeAmount: 0.5,
            };

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const quote = await provider.getQuote({
                amount: '100',
                fiatCurrency: 'USD',
                cryptoCurrency: 'TON',
                network: 'mainnet',
            });

            expect(global.fetch).toHaveBeenCalledWith(
                `https://api.moonpay.com/v3/currencies/ton/buy_quote?apiKey=${apiKey}&baseCurrencyCode=usd&baseCurrencyAmount=100`,
            );

            expect(quote).toEqual({
                fiatCurrency: 'USD',
                cryptoCurrency: 'TON',
                fiatAmount: '100',
                cryptoAmount: '45',
                rate: '0.45',
                fiatFee: '2',
                networkFeeFiat: '0.5',
                providerId: 'moonpay',
                metadata: mockResponse,
            });
        });

        it('should throw an OnrampError if the fetch fails', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: false,
                status: 500,
            });

            await expect(
                provider.getQuote({
                    amount: '100',
                    fiatCurrency: 'USD',
                    cryptoCurrency: 'TON',
                    network: 'mainnet',
                }),
            ).rejects.toThrow(OnrampError);
        });
    });

    describe('getLimits', () => {
        it('should fetch and return limits', async () => {
            const mockResponse = {
                baseCurrency: { minBuyAmount: 10, maxBuyAmount: 1000 },
            };

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const limits = await provider.getLimits({
                fiatCurrency: 'USD',
                cryptoCurrency: 'TON',
            });

            expect(global.fetch).toHaveBeenCalledWith(
                `https://api.moonpay.com/v3/currencies/ton/limits?apiKey=${apiKey}&baseCurrencyCode=usd`,
            );

            expect(limits).toEqual({
                minBaseAmount: 10,
                maxBaseAmount: 1000,
                providerId: 'moonpay',
            });
        });

        it('should throw if limits are empty or fetch fails', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });

            await expect(
                provider.getLimits({
                    fiatCurrency: 'USD',
                    cryptoCurrency: 'TON',
                }),
            ).rejects.toThrow(OnrampError);
        });
    });

    describe('getTransactionStatus', () => {
        it('should normalized and return transaction status', async () => {
            const mockResponse = {
                status: 'completed',
                id: 'tx_123',
                baseCurrency: { code: 'usd' },
                baseCurrencyAmount: 100,
                currency: { code: 'ton' },
                cryptoTransactionId: 'hash_456',
                walletAddress: 'addr_789',
            };

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const status = await provider.getTransactionStatus({ transactionId: 'tx_123' });

            expect(global.fetch).toHaveBeenCalledWith(
                `https://api.moonpay.com/v1/transactions/tx_123?apiKey=${apiKey}`,
            );

            expect(status).toEqual({
                status: 'completed',
                rawStatus: 'completed',
                transactionId: 'tx_123',
                fiatCurrency: 'usd',
                fiatAmount: '100',
                cryptoCurrency: 'ton',
                txHash: 'hash_456',
                walletAddress: 'addr_789',
                providerId: 'moonpay',
            });
        });
    });

    describe('buildOnrampUrl', () => {
        const userAddress = '0QCTestAddress...';

        it('should build a basic url with default TON currency when no quote is provided', async () => {
            const urlString = await provider.buildOnrampUrl({
                userAddress,
            });

            const url = new URL(urlString);
            expect(url.origin).toBe('https://buy.moonpay.com');
            expect(url.searchParams.get('apiKey')).toBe(apiKey);
            expect(url.searchParams.get('walletAddress')).toBe(userAddress);
            expect(url.searchParams.get('currencyCode')).toBe('ton');
        });

        it('should build a url using quote details if provided', async () => {
            const urlString = await provider.buildOnrampUrl({
                userAddress,
                quote: {
                    fiatCurrency: 'EUR',
                    cryptoCurrency: 'USDT',
                    fiatAmount: '500',
                    cryptoAmount: '530',
                    rate: '1.06',
                    providerId: 'moonpay',
                },
            });

            const url = new URL(urlString);
            expect(url.searchParams.get('currencyCode')).toBe('usdt');
            expect(url.searchParams.get('baseCurrencyCode')).toBe('eur');
            expect(url.searchParams.get('baseCurrencyAmount')).toBe('500');
        });

        it('should apply moonpay specific provider options', async () => {
            const urlString = await provider.buildOnrampUrl({
                userAddress,
                providerOptions: {
                    theme: 'dark',
                    redirectUrl: 'https://my-app.com/success',
                },
            });

            const url = new URL(urlString);
            expect(url.searchParams.get('theme')).toBe('dark');
            expect(url.searchParams.get('redirectURL')).toBe('https://my-app.com/success');
        });
    });
});

describe('MoonpayProvider Integration (Sandbox)', () => {
    let provider: MoonpayProvider;
    const sandboxApiKey = 'pk_test_J3c52pXIbsTmzwUtYJKQEpKwxuGw8me';

    beforeEach(() => {
        provider = new MoonpayProvider(sandboxApiKey);
    });

    it('should fetch real limits from Moonpay sandbox', async () => {
        const limits = await provider.getLimits({
            fiatCurrency: 'usd',
            cryptoCurrency: 'ton',
        });

        expect(limits).toBeDefined();
        expect(limits.minBaseAmount).toBeGreaterThan(0);
        expect(limits.maxBaseAmount).toBeGreaterThan(0);
        expect(limits.providerId).toBe('moonpay');
    });

    it('should fetch a real quote from Moonpay sandbox', async () => {
        const quote = await provider.getQuote({
            amount: '100',
            fiatCurrency: 'usd',
            cryptoCurrency: 'ton',
            network: Network.mainnet(),
        });

        expect(quote).toBeDefined();
        expect(quote.fiatAmount).toBe('100');
        expect(quote.cryptoAmount).toBeDefined();
        expect(parseFloat(quote.cryptoAmount)).toBeGreaterThan(0);
        expect(quote.rate).toBeDefined();
        expect(quote.providerId).toBe('moonpay');
    });

    it('should throw when getting transaction status for an invalid ID from sandbox', async () => {
        await expect(provider.getTransactionStatus({ transactionId: 'invalid_tx_id_123' })).rejects.toThrow(
            OnrampError,
        );
    });
});
