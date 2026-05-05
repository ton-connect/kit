/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network, registerProvider, getSwapQuote } from '@ton/appkit';
import type { OmnistonProviderOptions } from '@ton/walletkit/swap/omniston';
import { DeDustSwapProvider } from '@ton/appkit/swap/dedust';
import { OmnistonSwapProvider } from '@ton/appkit/swap/omniston';

export const omnistonQuickStartExample = (kit: AppKit) => {
    // SAMPLE_START: OMNISTON_QUICK_START
    const provider = new OmnistonSwapProvider({
        defaultSlippageBps: 100, // 1%
        quoteTimeoutMs: 10000,
    });
    kit.registerProvider(provider);
    // SAMPLE_END: OMNISTON_QUICK_START
};

export const omnistonUsageExample = async (appKit: AppKit) => {
    // SAMPLE_START: OMNISTON_USAGE_EXAMPLE
    const TON = { address: 'ton', decimals: 9 };
    const USDT = { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 };

    const quote = await getSwapQuote(appKit, {
        from: TON,
        to: USDT,
        amount: '0.1',
        network: Network.mainnet(),
        maxOutgoingMessages: 1,
    });
    // SAMPLE_END: OMNISTON_USAGE_EXAMPLE

    return quote;
};

export const omnistonReferralFeesExample = async (appKit: AppKit) => {
    // SAMPLE_START: OMNISTON_REFERRAL_FEES
    const TON = { address: 'ton', decimals: 9 };
    const USDT = { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 };

    const quote = await getSwapQuote(appKit, {
        from: TON,
        to: USDT,
        amount: '0.1',
        network: Network.mainnet(),
        providerOptions: {
            referrerAddress: 'EQ...',
            referrerFeeBps: 10, // 0.1%
        } as OmnistonProviderOptions,
    });
    // SAMPLE_END: OMNISTON_REFERRAL_FEES

    return quote;
};

export const omnistonOverridingReferralExample = async (appKit: AppKit) => {
    // SAMPLE_START: OMNISTON_OVERRIDING_REFERRAL
    const TON = { address: 'ton', decimals: 9 };
    const USDT = { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 };

    // Global referrer in config
    const provider = new OmnistonSwapProvider({
        referrerAddress: 'EQ...global',
        referrerFeeBps: 10,
    });
    appKit.registerProvider(provider);

    // Override for specific quote
    const quote = await getSwapQuote(appKit, {
        from: TON,
        to: USDT,
        amount: '1000000000',
        network: Network.mainnet(),
        providerOptions: {
            referrerAddress: 'EQ...different', // Uses this instead of global
            referrerFeeBps: 20,
        } as OmnistonProviderOptions,
    });

    // Or use global settings by omitting providerOptions
    const quote2 = await getSwapQuote(appKit, {
        from: TON,
        to: USDT,
        amount: '0.1',
        network: Network.mainnet(),
        // Uses global referrer from config
    });
    // SAMPLE_END: OMNISTON_OVERRIDING_REFERRAL

    return { quote, quote2 };
};

export const swapProviderInitExample = async () => {
    // SAMPLE_START: SWAP_PROVIDER_INIT
    // Initialize AppKit with swap providers
    const appKit = new AppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    url: 'https://toncenter.com',
                    key: 'your-key',
                },
            },
        },
        providers: [
            new OmnistonSwapProvider({
                apiUrl: 'https://api.ston.fi',
                defaultSlippageBps: 100, // 1%
            }),
            new DeDustSwapProvider({
                defaultSlippageBps: 100,
                referralAddress: 'EQ...', // Optional
            }),
        ],
    });
    // SAMPLE_END: SWAP_PROVIDER_INIT

    return appKit;
};

export const swapProviderRegisterExample = async () => {
    // SAMPLE_START: SWAP_PROVIDER_REGISTER
    // 1. Initialize AppKit
    const appKit = new AppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    url: 'https://toncenter.com',
                    key: 'your-key',
                },
            },
        },
    });

    // 2. Register swap providers
    registerProvider(appKit, new OmnistonSwapProvider({ defaultSlippageBps: 100 }));
    registerProvider(appKit, new DeDustSwapProvider({ defaultSlippageBps: 100 }));
    // SAMPLE_END: SWAP_PROVIDER_REGISTER

    return appKit;
};
