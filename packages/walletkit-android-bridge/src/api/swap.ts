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
import type { SwapProviderInterface, SwapQuote, SwapQuoteParams, SwapParams, TransactionRequest } from '@ton/walletkit';

import { getKit } from '../utils/bridge';
import { retainWithId, get } from '../utils/registry';

export async function createOmnistonSwapProvider(args: { config?: OmnistonSwapProviderConfig }): Promise<{ providerId: string }> {
    const provider = new OmnistonSwapProvider(args.config);
    retainWithId(provider.providerId, provider);
    return { providerId: provider.providerId };
}

export async function createDeDustSwapProvider(args: { config?: DeDustSwapProviderConfig }): Promise<{ providerId: string }> {
    const provider = new DeDustSwapProvider(args.config);
    retainWithId(provider.providerId, provider);
    return { providerId: provider.providerId };
}

export async function registerSwapProvider(args: { providerId: string }): Promise<{ ok: boolean }> {
    const kit = await getKit();
    const provider = get<SwapProviderInterface>(args.providerId);
    if (!provider) throw new Error(`Swap provider '${args.providerId}' not found`);
    kit.swap!.registerProvider(provider);
    return { ok: true };
}

export async function getSwapQuote(args: { params: SwapQuoteParams; providerId?: string }): Promise<SwapQuote> {
    const kit = await getKit();
    return kit.swap!.getQuote(args.params, args.providerId);
}

export async function buildSwapTransaction(args: { params: SwapParams }): Promise<TransactionRequest> {
    const kit = await getKit();
    return kit.swap!.buildSwapTransaction(args.params);
}
