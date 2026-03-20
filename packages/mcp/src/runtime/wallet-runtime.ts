/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { randomBytes } from 'node:crypto';

import { Network, Signer, WalletV4R2Adapter, WalletV5R1Adapter } from '@ton/walletkit';
import type { TonWalletKit as TonWalletKitType, Wallet, WalletAdapter, WalletSigner } from '@ton/walletkit';

import { AgenticWalletAdapter } from '../contracts/agentic_wallet/AgenticWalletAdapter.js';
import type { IContactResolver } from '../types/contacts.js';
import { McpWalletService } from '../services/McpWalletService.js';
import type {
    StandardWalletVersion,
    StoredAgenticWallet,
    StoredStandardWallet,
    StoredWallet,
    TonNetwork,
} from '../registry/config.js';
import { ConfigError } from '../registry/config.js';
import { readSecret, readSecretMaterial } from '../registry/private-key-files.js';
import { parsePrivateKeyInput } from '../utils/private-key.js';
import { getSharedTonWalletKit } from './shared-ton-wallet-kit.js';

export interface WalletServiceContext {
    service: McpWalletService;
    close: () => Promise<void>;
}

function getKitNetwork(network: TonNetwork) {
    return network === 'testnet' ? Network.testnet() : Network.mainnet();
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

async function createSignerFromSecrets(input: { mnemonic?: string; privateKey?: string }): Promise<WalletSigner> {
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

async function createWalletServiceWithAdapter(input: {
    network: TonNetwork;
    contacts: IContactResolver | undefined;
    toncenterApiKey?: string;
    createAdapter: (kit: TonWalletKitType) => Promise<WalletAdapter>;
}): Promise<WalletServiceContext> {
    const kit = await getSharedTonWalletKit(input.network, input.toncenterApiKey);

    let adapter: WalletAdapter | null = null;
    try {
        adapter = await input.createAdapter(kit);
        await addWallet(kit, adapter);
        const service = await McpWalletService.create({
            wallet: adapter,
            contacts: input.contacts,
            networks: {
                [input.network]: input.toncenterApiKey ? { apiKey: input.toncenterApiKey } : undefined,
            },
        });
        return {
            service,
            close: async () => {
                await Promise.allSettled([
                    service.close(),
                    adapter
                        ? kit.removeWallet(adapter).catch(() => {
                              // Best-effort cleanup for shared kit teardown.
                          })
                        : Promise.resolve(),
                ]);
            },
        };
    } catch (error) {
        if (adapter) {
            await kit.removeWallet(adapter).catch(() => {
                // Best-effort cleanup for shared kit teardown.
            });
        }
        throw error;
    }
}

async function createServiceFromStoredStandard(
    wallet: StoredStandardWallet,
    contacts: IContactResolver | undefined,
    toncenterApiKey?: string,
): Promise<WalletServiceContext> {
    const secret = readSecretMaterial(wallet);
    if (!secret) {
        throw new ConfigError(
            `Wallet "${wallet.name}" is missing signing credentials. Re-import it with mnemonic or private key before using write tools.`,
        );
    }
    const signer = await createSignerFromSecrets({
        ...(secret.type === 'mnemonic' ? { mnemonic: secret.value } : {}),
        ...(secret.type === 'private_key' ? { privateKey: secret.value } : {}),
    });
    return createWalletServiceWithAdapter({
        network: wallet.network,
        contacts,
        toncenterApiKey,
        createAdapter: (kit) =>
            createStandardAdapter({
                signer,
                kit,
                network: wallet.network,
                walletVersion: wallet.wallet_version,
            }),
    });
}

async function createServiceFromStoredAgentic(
    wallet: StoredAgenticWallet,
    contacts: IContactResolver | undefined,
    toncenterApiKey?: string,
    requiresSigning?: boolean,
): Promise<WalletServiceContext> {
    const privateKey = readSecret(wallet);
    if (requiresSigning && !privateKey) {
        throw new ConfigError(
            `Wallet "${wallet.name}" is missing private_key. Rotate the operator key with agentic_rotate_operator_key before using write tools.`,
        );
    }
    const signer = privateKey ? await createSignerFromSecrets({ privateKey }) : await createPlaceholderSigner();
    return createWalletServiceWithAdapter({
        network: wallet.network,
        contacts,
        toncenterApiKey,
        createAdapter: (kit) =>
            AgenticWalletAdapter.create(signer, {
                client: kit.getApiClient(getKitNetwork(wallet.network)),
                network: getKitNetwork(wallet.network),
                walletAddress: wallet.address,
            }),
    });
}

export async function createMcpWalletServiceFromStoredWallet(input: {
    wallet: StoredWallet;
    contacts?: IContactResolver;
    toncenterApiKey?: string;
    requiresSigning?: boolean;
}): Promise<WalletServiceContext> {
    if (!input.requiresSigning) {
        const network = getKitNetwork(input.wallet.network);
        const kit = await getSharedTonWalletKit(input.wallet.network, input.toncenterApiKey);
        const service = await McpWalletService.createReadOnly({
            address: input.wallet.address,
            network,
            client: kit.getApiClient(network),
            contacts: input.contacts,
            networks: {
                [input.wallet.network]: input.toncenterApiKey ? { apiKey: input.toncenterApiKey } : undefined,
            },
        });

        return {
            service,
            close: async () => {
                await service.close();
            },
        };
    }

    return input.wallet.type === 'standard'
        ? createServiceFromStoredStandard(input.wallet, input.contacts, input.toncenterApiKey)
        : createServiceFromStoredAgentic(input.wallet, input.contacts, input.toncenterApiKey, input.requiresSigning);
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
    const kit = await getSharedTonWalletKit(input.network, input.toncenterApiKey);

    const adapter = await createStandardAdapter({
        signer,
        kit,
        network: input.network,
        walletVersion: input.walletVersion,
    });
    return adapter.getAddress();
}
