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

import { bridgeRequest } from '../transport/nativeBridge';
import { getKit } from '../utils/bridge';
import { get, release, retainWithId } from '../utils/registry';

/**
 * JS-side proxy that implements [SwapProviderInterface] by forwarding every call to a
 * Kotlin-implemented `ITONSwapProvider` via reverse-RPC. Mirrors the Kotlin staking / streaming
 * proxy pattern.
 */
class ProxySwapProvider implements SwapProviderInterface {
    readonly type = 'swap' as const;

    constructor(readonly providerId: string) {}

    async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
        const resultJson = (await bridgeRequest('kotlinSwapProviderQuote', {
            providerId: this.providerId,
            params: JSON.stringify(params),
        })) as string;
        return JSON.parse(resultJson) as SwapQuote;
    }

    async buildSwapTransaction(params: SwapParams): Promise<TransactionRequest> {
        const resultJson = (await bridgeRequest('kotlinSwapProviderBuildSwapTransaction', {
            providerId: this.providerId,
            params: JSON.stringify(params),
        })) as string;
        return JSON.parse(resultJson) as TransactionRequest;
    }
}

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

/**
 * Tell the JS swap manager that a Kotlin-implemented provider is available.
 * A [ProxySwapProvider] is created and registered; all subsequent swap operations on it
 * forward to the Kotlin instance via reverse-RPC.
 */
export async function registerKotlinSwapProvider(args: { providerId: string }): Promise<void> {
    const previous = get<ProxySwapProvider>(args.providerId);
    if (previous instanceof ProxySwapProvider) {
        release(args.providerId);
    }
    const provider = new ProxySwapProvider(args.providerId);
    retainWithId(args.providerId, provider);
    (await getSwap()).registerProvider(provider);
}
