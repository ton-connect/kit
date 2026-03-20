/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { randomBytes } from 'node:crypto';

import {
    MemoryStorageAdapter,
    Network,
    Signer,
    TonWalletKit,
    WalletV4R2Adapter,
    WalletV5R1Adapter,
} from '@ton/walletkit';
import type { ApiClient, TonWalletKit as TonWalletKitType, Wallet, WalletAdapter, WalletSigner } from '@ton/walletkit';
import type { StorageAdapter } from '@ton/walletkit';
import type { TonWalletKitOptions } from '@ton/walletkit';

import { AgenticWalletAdapter } from '../contracts/agentic_wallet/AgenticWalletAdapter.js';
import type { IContactResolver } from '../types/contacts.js';
import { McpWalletService } from '../services/McpWalletService.js';
import type { StandardWalletVersion, StoredWallet, TonNetwork } from '../registry/config.js';
import { parsePrivateKeyInput } from '../utils/private-key.js';
import { createApiClient } from '../utils/ton-client.js';

export interface WalletServiceContext {
    service: McpWalletService;
    close: () => Promise<void>;
}

export interface WalletAdapterSource {
    walletVersion: 'agentic' | 'v4r2' | 'v5r1';
    mnemonic?: string;
    privateKey?: string;
    walletAddress?: string;
    walletNftIndex?: bigint;
    collectionAddress?: string;
}

export function createTonWalletKit(input: {
    network: TonNetwork;
    apiKey?: string;
    storage?: StorageAdapter;
    walletKitOptions?: Omit<TonWalletKitOptions, 'networks' | 'storage'>;
}): TonWalletKitType {
    const normalized = input.network === 'testnet' ? Network.testnet() : Network.mainnet();
    return new TonWalletKit({
        networks: {
            [normalized.chainId]: { apiClient: createApiClient(input.network, input.apiKey) },
        },
        storage: input.storage ?? new MemoryStorageAdapter(),
        ...input.walletKitOptions,
    });
}

function createKit(network: TonNetwork, apiKey?: string): TonWalletKitType {
    return createTonWalletKit({ network, apiKey });
}

function getKitNetwork(network: TonNetwork) {
    return network === 'testnet' ? Network.testnet() : Network.mainnet();
}

export async function closeKitSafely(kit: TonWalletKitType): Promise<void> {
    try {
        await kit.close();
    } catch {
        // Best-effort cleanup for failed initialization.
    }
}

async function addWallet(kit: TonWalletKitType, adapter: WalletAdapter): Promise<Wallet> {
    let wallet = await kit.addWallet(adapter);
    if (!wallet) {
        wallet = kit.getWallet(adapter.getWalletId());
    }
    if (!wallet) {
        throw new Error('Failed to create wallet');
    }
    return wallet;
}

export async function createSignerFromSecrets(input: { mnemonic?: string; privateKey?: string }): Promise<WalletSigner> {
    if (input.mnemonic) {
        return Signer.fromMnemonic(input.mnemonic.trim().split(/\s+/), { type: 'ton' });
    }
    if (input.privateKey) {
        return Signer.fromPrivateKey(parsePrivateKeyInput(input.privateKey).seed);
    }
    throw new Error('Wallet credentials are missing.');
}

async function createPlaceholderSigner(): Promise<WalletSigner> {
    return Signer.fromPrivateKey(randomBytes(32));
}

export async function createStandardAdapter(input: {
    network: TonNetwork;
    walletVersion: StandardWalletVersion;
    signer: WalletSigner;
    kit: TonWalletKitType;
}): Promise<WalletAdapter> {
    const network = getKitNetwork(input.network);
    return input.walletVersion === 'v4r2'
        ? WalletV4R2Adapter.create(input.signer, {
              client: input.kit.getApiClient(network),
              network,
          })
        : WalletV5R1Adapter.create(input.signer, {
              client: input.kit.getApiClient(network),
              network,
          });
}

export async function createWalletAdapterFromSigner(input: {
    signer: WalletSigner;
    client: ApiClient;
    network: Network;
    walletVersion: 'agentic' | 'v4r2' | 'v5r1';
    agentic?: {
        walletAddress?: string;
        walletNftIndex?: bigint;
        collectionAddress?: string;
    };
}): Promise<WalletAdapter> {
    if (input.walletVersion === 'v4r2') {
        return WalletV4R2Adapter.create(input.signer, {
            client: input.client,
            network: input.network,
        });
    }

    if (input.walletVersion === 'v5r1') {
        return WalletV5R1Adapter.create(input.signer, {
            client: input.client,
            network: input.network,
        });
    }

    return AgenticWalletAdapter.create(input.signer, {
        client: input.client,
        network: input.network,
        walletAddress: input.agentic?.walletAddress,
        walletNftIndex: input.agentic?.walletNftIndex,
        collectionAddress: input.agentic?.collectionAddress,
    });
}

export async function createWalletAdapterFromSource(input: {
    source: WalletAdapterSource;
    requiresSigning?: boolean;
    client: ApiClient;
    network: Network;
}): Promise<WalletAdapter> {
    const signer =
        input.source.mnemonic || input.source.privateKey
            ? await createSignerFromSecrets({
                  mnemonic: input.source.mnemonic,
                  privateKey: input.source.privateKey,
              })
            : await createPlaceholderSigner();

    if (
        input.requiresSigning &&
        !input.source.mnemonic &&
        !input.source.privateKey
    ) {
        throw new Error(`Wallet configuration for ${input.source.walletVersion} is missing signing credentials.`);
    }

    return createWalletAdapterFromSigner({
        signer,
        client: input.client,
        network: input.network,
        walletVersion: input.source.walletVersion,
        agentic:
            input.source.walletVersion === 'agentic'
                ? {
                      walletAddress: input.source.walletAddress,
                      walletNftIndex: input.source.walletNftIndex,
                      collectionAddress: input.source.collectionAddress,
                  }
                : undefined,
    });
}

export async function createWalletAdapterFromStoredWallet(input: {
    wallet: StoredWallet;
    requiresSigning?: boolean;
    kit: TonWalletKitType;
}): Promise<WalletAdapter> {
    return createWalletAdapterFromSource({
        source:
            input.wallet.type === 'standard'
                ? {
                      walletVersion: input.wallet.wallet_version,
                      mnemonic: input.wallet.mnemonic,
                      privateKey: input.wallet.private_key,
                  }
                : {
                      walletVersion: 'agentic',
                      privateKey: input.wallet.operator_private_key,
                      walletAddress: input.wallet.address,
                      collectionAddress: input.wallet.collection_address,
                  },
        requiresSigning: input.requiresSigning,
        client: input.kit.getApiClient(getKitNetwork(input.wallet.network)),
        network: getKitNetwork(input.wallet.network),
    });
}

async function createServiceFromStoredWallet(
    wallet: StoredWallet,
    contacts: IContactResolver | undefined,
    toncenterApiKey?: string,
    requiresSigning?: boolean,
): Promise<WalletServiceContext> {
    const kit = createKit(wallet.network, toncenterApiKey);
    await kit.waitForReady();
    try {
        const adapter = await createWalletAdapterFromStoredWallet({
            wallet,
            requiresSigning,
            kit,
        });
        await addWallet(kit, adapter);
        const service = await McpWalletService.create({
            wallet: adapter,
            contacts,
            networks: {
                [wallet.network]: toncenterApiKey ? { apiKey: toncenterApiKey } : undefined,
            },
        });
        return {
            service,
            close: async () => {
                await Promise.allSettled([service.close(), closeKitSafely(kit)]);
            },
        };
    } catch (error) {
        await closeKitSafely(kit);
        throw error;
    }
}

export async function createMcpWalletServiceFromStoredWallet(input: {
    wallet: StoredWallet;
    contacts?: IContactResolver;
    toncenterApiKey?: string;
    requiresSigning?: boolean;
}): Promise<WalletServiceContext> {
    return createServiceFromStoredWallet(input.wallet, input.contacts, input.toncenterApiKey, input.requiresSigning);
}

export async function deriveStandardWalletAddress(input: {
    mnemonic?: string;
    privateKey?: string;
    network: TonNetwork;
    walletVersion: StandardWalletVersion;
    toncenterApiKey?: string;
}): Promise<string> {
    const signer = await createSignerFromSecrets({
        mnemonic: input.mnemonic,
        privateKey: input.privateKey,
    });
    const kit = createKit(input.network, input.toncenterApiKey);
    await kit.waitForReady();

    try {
        const adapter = await createStandardAdapter({
            signer,
            kit,
            network: input.network,
            walletVersion: input.walletVersion,
        });
        return adapter.getAddress();
    } finally {
        await closeKitSafely(kit);
    }
}
