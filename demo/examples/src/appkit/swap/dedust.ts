/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { Network, getSwapQuote } from '@ton/appkit';
import type { DeDustProviderOptions } from '@ton/walletkit/swap/dedust';
import { DeDustSwapProvider } from '@ton/appkit/swap/dedust';

export const dedustQuickStartExample = (kit: AppKit) => {
    // SAMPLE_START: DEDUST_QUICK_START
    const provider = new DeDustSwapProvider({
        defaultSlippageBps: 100, // 1%
        referralAddress: 'EQ...',
        referralFeeBps: 50, // 0.5%
    });
    kit.registerProvider(provider);
    // SAMPLE_END: DEDUST_QUICK_START
};

export const dedustProtocolRoutingExample = async (appKit: AppKit) => {
    // SAMPLE_START: DEDUST_PROTOCOL_ROUTING
    const TON = { address: 'ton', decimals: 9 };
    const USDT = { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 };

    const quote = await getSwapQuote(appKit, {
        from: TON,
        to: USDT,
        amount: '1000000000',
        network: Network.mainnet(),
        providerOptions: {
            protocols: ['dedust', 'dedust_v3', 'stonfi_v1', 'stonfi_v2', 'tonco'],
            excludeProtocols: ['memeslab'],
            onlyVerifiedPools: true,
            maxSplits: 4,
            maxLength: 3,
            excludeVolatilePools: true,
        } as DeDustProviderOptions,
    });
    // SAMPLE_END: DEDUST_PROTOCOL_ROUTING

    return quote;
};

export const dedustReferralFeesExample = async (appKit: AppKit) => {
    // SAMPLE_START: DEDUST_REFERRAL_FEES
    const TON = { address: 'ton', decimals: 9 };
    const USDT = { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 };

    const quote = await getSwapQuote(appKit, {
        from: TON,
        to: USDT,
        amount: '1000000000',
        network: Network.mainnet(),
        providerOptions: {
            referralAddress: 'EQ...',
            referralFeeBps: 50, // 0.5%
        } as DeDustProviderOptions,
    });
    // SAMPLE_END: DEDUST_REFERRAL_FEES

    return quote;
};

export const dedustOverridingReferralExample = async (appKit: AppKit) => {
    // SAMPLE_START: DEDUST_OVERRIDING_REFERRAL
    const TON = { address: 'ton', decimals: 9 };
    const USDT = { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 };

    // Global referrer in config
    const provider = new DeDustSwapProvider({
        referralAddress: 'EQ...global',
        referralFeeBps: 50,
    });
    appKit.registerProvider(provider);

    // Override for specific quote
    const quote = await getSwapQuote(appKit, {
        from: TON,
        to: USDT,
        amount: '1000000000',
        network: Network.mainnet(),
        providerOptions: {
            referralAddress: 'EQ...different', // Uses this instead of global
            referralFeeBps: 75,
        } as DeDustProviderOptions,
    });

    // Or use global settings by omitting providerOptions
    const quote2 = await getSwapQuote(appKit, {
        from: TON,
        to: USDT,
        amount: '1000000000',
        network: Network.mainnet(),
        // Uses global referrer from config
    });
    // SAMPLE_END: DEDUST_OVERRIDING_REFERRAL

    return { quote, quote2 };
};
