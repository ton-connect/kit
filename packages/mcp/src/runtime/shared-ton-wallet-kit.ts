/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MemoryStorageAdapter, Network, TonWalletKit } from '@ton/walletkit';
import type { TonWalletKit as TonWalletKitType } from '@ton/walletkit';
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';

import { createApiClient } from '../utils/ton-client.js';

export type SharedWalletNetwork = 'mainnet' | 'testnet';

interface SharedTonWalletKitState {
    network: SharedWalletNetwork;
    apiKey?: string;
    kit: Promise<TonWalletKitType>;
}

let sharedTonWalletKit: SharedTonWalletKitState | null = null;

function normalizeApiKey(apiKey?: string): string | undefined {
    const normalized = apiKey?.trim();
    return normalized ? normalized : undefined;
}

async function createSharedTonWalletKit(network: SharedWalletNetwork, apiKey?: string): Promise<TonWalletKitType> {
    let kit: TonWalletKitType | null = null;

    try {
        const tonNetwork = network === 'testnet' ? Network.testnet() : Network.mainnet();
        kit = new TonWalletKit({
            networks: {
                [tonNetwork.chainId]: {
                    apiClient: createApiClient(network, normalizeApiKey(apiKey)),
                },
            },
            storage: new MemoryStorageAdapter(),
        });

        await kit.waitForReady();
        kit.swap.registerProvider(
            new OmnistonSwapProvider({
                defaultSlippageBps: 100,
            }),
        );

        return kit;
    } catch (error) {
        if (kit) {
            try {
                await kit.close();
            } catch {
                // Best-effort cleanup for failed initialization.
            }
        }
        throw error;
    }
}

export function getSharedTonWalletKit(network: SharedWalletNetwork, apiKey?: string): Promise<TonWalletKitType> {
    const normalizedApiKey = normalizeApiKey(apiKey);
    if (sharedTonWalletKit && sharedTonWalletKit.network === network && sharedTonWalletKit.apiKey === normalizedApiKey) {
        return sharedTonWalletKit.kit;
    }

    const kit = createSharedTonWalletKit(network, normalizedApiKey)

    sharedTonWalletKit = {
        network,
        apiKey: normalizedApiKey,
        kit,
    };
    return kit;
}

export async function closeSharedTonWalletKit(): Promise<void> {
    const state = sharedTonWalletKit;
    sharedTonWalletKit = null;

    if (!state) {
        return;
    }

    const kit = await state.kit;
    await kit.close();
}
