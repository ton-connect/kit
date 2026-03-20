/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/walletkit';
import type { WalletAdapter } from '@ton/walletkit';

import { createTonWalletKit, createWalletAdapterFromStoredWallet, closeKitSafely } from '../runtime/wallet-runtime.js';
import type { StoredWallet, TonNetwork } from '../registry/config.js';
import type { NetworkConfig } from './McpWalletService.js';
import { FileBackedStorageAdapter } from './FileBackedStorageAdapter.js';
import { resolveTonConnectConfig } from './TonConnectConfigService.js';
import { TonConnectRuntimeService } from './TonConnectRuntimeService.js';
import { TonConnectStore } from './TonConnectStore.js';
import { WalletRegistryService } from './WalletRegistryService.js';
import type { TonConnectResolvedConfig } from '../types/tonconnect.js';

interface RuntimeEntry {
    runtime?: TonConnectRuntimeService;
    initPromise?: Promise<TonConnectRuntimeService>;
}

export interface TonConnectRuntimeRegistryOptions {
    registry?: WalletRegistryService;
    singleWallet?: WalletAdapter;
    singleWalletFactory?: () => Promise<WalletAdapter>;
    networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };
}

function networkFromAdapter(wallet: WalletAdapter): TonNetwork {
    return wallet.getNetwork().chainId === Network.testnet().chainId ? 'testnet' : 'mainnet';
}

export class TonConnectRuntimeRegistry {
    private readonly registry?: WalletRegistryService;
    private readonly singleWallet?: WalletAdapter;
    private readonly singleWalletFactory?: () => Promise<WalletAdapter>;
    private readonly networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };
    private readonly entries = new Map<string, RuntimeEntry>();

    constructor(options: TonConnectRuntimeRegistryOptions) {
        this.registry = options.registry;
        this.singleWallet = options.singleWallet;
        this.singleWalletFactory = options.singleWalletFactory;
        this.networks = options.networks;
    }

    async getOrCreate(walletSelector?: string): Promise<TonConnectRuntimeService> {
        const descriptor = await this.resolveDescriptor(walletSelector);
        const existing = this.entries.get(descriptor.runtimeKey);
        if (existing?.runtime) {
            await existing.runtime.start();
            return existing.runtime;
        }
        if (existing?.initPromise) {
            return existing.initPromise;
        }

        const initPromise = this.createRuntime(descriptor)
            .then(async (runtime) => {
                await runtime.start();
                this.entries.set(descriptor.runtimeKey, { runtime });
                return runtime;
            })
            .catch((error) => {
                this.entries.delete(descriptor.runtimeKey);
                throw error;
            });

        this.entries.set(descriptor.runtimeKey, { initPromise });
        return initPromise;
    }

    async closeAll(): Promise<void> {
        const runtimes = [...this.entries.values()].map((entry) => entry.runtime).filter(Boolean);
        this.entries.clear();
        await Promise.allSettled(runtimes.map((runtime) => runtime!.close()));
    }

    private async createRuntime(descriptor: Awaited<ReturnType<TonConnectRuntimeRegistry['resolveDescriptor']>>) {
        const config = resolveTonConnectConfig(descriptor.runtimeKey);
        const storageAdapter = new FileBackedStorageAdapter(config.storagePath, {
            prefix: config.storagePrefix,
        });
        const store = new TonConnectStore(storageAdapter);

        return new TonConnectRuntimeService({
            runtimeKey: descriptor.runtimeKey,
            config,
            store,
            createContext: async () => {
                if (descriptor.mode === 'single') {
                    const network = networkFromAdapter(descriptor.wallet);
                    return this.createManagedContext({
                        adapter: descriptor.wallet,
                        network,
                        apiKey: this.networks?.[network]?.apiKey,
                        storageAdapter,
                        config,
                    });
                }

                if (descriptor.mode === 'singleFactory') {
                    const adapter = await descriptor.createWallet();
                    const network = networkFromAdapter(adapter);
                    return this.createManagedContext({
                        adapter,
                        network,
                        apiKey: this.networks?.[network]?.apiKey,
                        storageAdapter,
                        config,
                    });
                }

                return this.createManagedContext({
                    adapter: async (kit) =>
                        createWalletAdapterFromStoredWallet({
                            wallet: descriptor.wallet,
                            requiresSigning: true,
                            kit,
                        }),
                    network: descriptor.wallet.network,
                    apiKey: descriptor.toncenterApiKey,
                    storageAdapter,
                    config,
                });
            },
        });
    }

    private createWalletKitOptions(config: TonConnectResolvedConfig) {
        return {
            bridge: {
                bridgeUrl: config.bridgeUrl,
            },
            ...(config.walletManifest ? { walletManifest: config.walletManifest } : {}),
            ...(config.deviceInfo ? { deviceInfo: config.deviceInfo } : {}),
        };
    }

    private async createManagedContext(input: {
        adapter: WalletAdapter | ((kit: ReturnType<typeof createTonWalletKit>) => Promise<WalletAdapter>);
        network: TonNetwork;
        apiKey?: string;
        storageAdapter: FileBackedStorageAdapter;
        config: TonConnectResolvedConfig;
    }) {
        const kit = createTonWalletKit({
            network: input.network,
            apiKey: input.apiKey,
            storage: input.storageAdapter,
            walletKitOptions: this.createWalletKitOptions(input.config),
        });
        await kit.waitForReady();

        try {
            return {
                kit,
                adapter:
                    typeof input.adapter === 'function'
                        ? await input.adapter(kit)
                        : input.adapter,
                close: async () => {
                    await closeKitSafely(kit);
                },
            };
        } catch (error) {
            await closeKitSafely(kit);
            throw error;
        }
    }

    private async resolveDescriptor(walletSelector?: string): Promise<
        | {
              mode: 'single';
              runtimeKey: string;
              wallet: WalletAdapter;
          }
        | {
              mode: 'singleFactory';
              runtimeKey: string;
              createWallet: () => Promise<WalletAdapter>;
          }
        | {
              mode: 'registry';
              runtimeKey: string;
              wallet: StoredWallet;
              toncenterApiKey?: string;
          }
    > {
        if (this.singleWallet) {
            return {
                mode: 'single',
                runtimeKey: this.singleWallet.getWalletId(),
                wallet: this.singleWallet,
            };
        }

        if (this.singleWalletFactory) {
            return {
                mode: 'singleFactory',
                runtimeKey: 'single-wallet',
                createWallet: this.singleWalletFactory,
            };
        }

        if (!this.registry) {
            throw new Error('TonConnect runtime registry is not configured.');
        }

        const { wallet, toncenterApiKey } = await this.registry.resolveWalletSelection(walletSelector, {
            requiresSigning: true,
        });
        return {
            mode: 'registry',
            runtimeKey: wallet.id,
            wallet,
            toncenterApiKey,
        };
    }
}
