/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';
import type { OmnistonSwapProviderConfig } from '@ton/walletkit/swap/omniston';
import { DeDustSwapProvider } from '@ton/walletkit/swap/dedust';
import type { DeDustSwapProviderConfig } from '@ton/walletkit/swap/dedust';
import type {
    SwapAPI,
    SwapProviderInterface,
    SwapQuote,
    SwapQuoteParams,
    SwapParams,
    TransactionRequest,
} from '@ton/walletkit';

import { getKit } from '../utils/bridge';
import { retainWithId, get } from '../utils/registry';

async function getSwap(): Promise<SwapAPI> {
    const instance = await getKit();
    if (!instance.swap) throw new Error('Swap is not configured');
    return instance.swap;
}

export async function createOmnistonSwapProvider(args: {
    config?: OmnistonSwapProviderConfig;
}): Promise<{ providerId: string }> {
    const provider = new OmnistonSwapProvider(args.config);
    retainWithId(provider.providerId, provider);
    return { providerId: provider.providerId };
}

export async function createDeDustSwapProvider(args: {
    config?: DeDustSwapProviderConfig;
}): Promise<{ providerId: string }> {
    const provider = new DeDustSwapProvider(args.config);
    retainWithId(provider.providerId, provider);
    return { providerId: provider.providerId };
}

export async function registerSwapProvider(args: { providerId: string }): Promise<void> {
    (await getSwap()).registerProvider(get(args.providerId) as SwapProviderInterface);
}

export async function setDefaultSwapProvider(args: { providerId: string }): Promise<void> {
    (await getSwap()).setDefaultProvider(args.providerId);
}

export async function getRegisteredSwapProviders(): Promise<{ providerIds: string[] }> {
    const providerIds = (await getSwap()).getRegisteredProviders();
    return { providerIds };
}

export async function hasSwapProvider(args: { providerId: string }): Promise<{ result: boolean }> {
    const result = (await getSwap()).hasProvider(args.providerId);
    return { result };
}

export async function getSwapQuote(args: { params: SwapQuoteParams; providerId?: string }): Promise<SwapQuote> {
    return (await getSwap()).getQuote(args.params, args.providerId);
}

export async function buildSwapTransaction(args: { params: SwapParams }): Promise<TransactionRequest> {
    return (await getSwap()).buildSwapTransaction(args.params);
}
