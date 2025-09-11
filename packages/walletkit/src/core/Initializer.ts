// Initialization and setup logic

import { CHAIN } from '@tonconnect/protocol';

import { ApiClientToncenter } from './ApiClientToncenter';
import {
    TonWalletKitOptions,
    WalletInterface,
    WalletInitConfig,
    DEFAULT_DURABLE_EVENTS_CONFIG,
    isWalletInitConfigMnemonic,
    isWalletInitConfigPrivateKey,
    isWalletInitConfigSigner,
} from '../types';
import type { StorageAdapter } from '../storage';
import { createStorageAdapter } from '../storage';
import { validateWallet } from '../validation';
import { WalletManager } from './WalletManager';
import { SessionManager } from './SessionManager';
import { BridgeManager } from './BridgeManager';
import { EventRouter } from './EventRouter';
import { RequestProcessor } from './RequestProcessor';
import { globalLogger } from './Logger';
import type { EventEmitter } from './EventEmitter';
import { createWalletV5R1 } from '../contracts/w5/WalletV5R1Adapter';
import { StorageEventStore } from './EventStore';
import { StorageEventProcessor } from './EventProcessor';
import { WalletInitInterface } from '../types/wallet';
import { WalletTonClass } from './wallet/extensions/ton';
import { WalletJettonClass } from './wallet/extensions/jetton';
import { WalletNftClass } from './wallet/extensions/nft';
import { ApiClient } from '../types/toncenter/ApiClient';

const log = globalLogger.createChild('Initializer');

/**
 * Initialization configuration
 */
export interface InitializationConfig {
    retryAttempts?: number;
    retryDelay?: number;
    timeoutMs?: number;
    network?: CHAIN;
}

/**
 * Initialization result
 */
export interface InitializationResult {
    walletManager: WalletManager;
    sessionManager: SessionManager;
    bridgeManager: BridgeManager;
    eventRouter: EventRouter;
    requestProcessor: RequestProcessor;
    storageAdapter: StorageAdapter;
    tonClient: ApiClient;
    eventProcessor: StorageEventProcessor;
}

/**
 * Handles initialization of all TonWalletKit components
 */
export class Initializer {
    // private config: InitializationConfig;
    private tonClient!: ApiClient;
    private eventEmitter: EventEmitter;
    private network: CHAIN;
    private retryAttempts: number;
    private retryDelay: number;
    private timeoutMs: number;

    constructor(config: InitializationConfig = {}, eventEmitter: EventEmitter) {
        this.network = config.network ?? CHAIN.MAINNET;
        this.retryAttempts = config.retryAttempts ?? 3;
        this.retryDelay = config.retryDelay ?? 1000;
        this.timeoutMs = config.timeoutMs ?? 10000;
        this.eventEmitter = eventEmitter;
    }

    /**
     * Initialize all components
     */
    async initialize(options: TonWalletKitOptions): Promise<InitializationResult> {
        try {
            log.info('Initializing TonWalletKit...');

            // 1. Initialize TON client first (single provider for all downstream classes)
            this.tonClient = this.initializeTonClient(options);

            // 2. Initialize storage adapter
            const storageAdapter = this.initializeStorage(options);

            // 3. Initialize core managers
            const { walletManager, sessionManager, bridgeManager, eventRouter, eventProcessor } =
                await this.initializeManagers(options, storageAdapter);

            // 5. Initialize processors
            const { requestProcessor } = this.initializeProcessors(sessionManager, bridgeManager);

            log.info('TonWalletKit initialized successfully');

            return {
                walletManager,
                sessionManager,
                bridgeManager,
                eventRouter,
                requestProcessor,
                storageAdapter,
                tonClient: this.tonClient,
                eventProcessor,
            };
        } catch (error) {
            log.error('Failed to initialize TonWalletKit', { error });
            throw error;
        }
    }

    /**
     * Initialize TON client (single provider for all downstream classes)
     */
    private initializeTonClient(options: TonWalletKitOptions): ApiClient {
        // Use provided API URL or default to mainnet
        const endpoint = options.apiUrl || 'https://toncenter.com';

        const clientConfig = {
            endpoint,
            apiKey: options.apiKey,
        };

        return new ApiClientToncenter(clientConfig);
    }

    /**
     * Initialize storage adapter
     */
    private initializeStorage(options: TonWalletKitOptions): StorageAdapter {
        if (options.storage) {
            return options.storage;
        }

        return createStorageAdapter({
            prefix: 'tonwalletkit:',
        });
    }

    /**
     * Initialize core managers
     */
    private async initializeManagers(
        options: TonWalletKitOptions,
        storageAdapter: StorageAdapter,
    ): Promise<{
        walletManager: WalletManager;
        sessionManager: SessionManager;
        bridgeManager: BridgeManager;
        eventRouter: EventRouter;
        eventProcessor: StorageEventProcessor;
    }> {
        // Initialize managers
        const walletManager = new WalletManager(storageAdapter);
        await walletManager.initialize();
        // 4. Initialize with provided wallets
        if (options.wallets && options.wallets.length > 0) {
            await this.initializeWallets(walletManager, {
                ...options,
                wallets: options.wallets,
            });
        }

        const sessionManager = new SessionManager(storageAdapter, walletManager);
        await sessionManager.initialize();

        const eventStore = new StorageEventStore(storageAdapter);
        const eventRouter = new EventRouter(this.eventEmitter, sessionManager);

        const bridgeManager = new BridgeManager(
            options.config.bridge,
            sessionManager,
            storageAdapter,
            eventStore,
            eventRouter,
            this.eventEmitter,
        );
        await bridgeManager.start();

        // Create event processor for durable events
        // TODO - change default values
        const eventProcessor = new StorageEventProcessor(
            options.config.eventProcessor,
            eventStore,
            DEFAULT_DURABLE_EVENTS_CONFIG,
            walletManager,
            sessionManager,
            eventRouter,
            this.eventEmitter,
        );

        return {
            walletManager,
            sessionManager,
            bridgeManager,
            eventRouter,
            eventProcessor,
        };
    }

    /**
     * Initialize processors
     */
    private initializeProcessors(
        sessionManager: SessionManager,
        bridgeManager: BridgeManager,
    ): {
        requestProcessor: RequestProcessor;
    } {
        const requestProcessor = new RequestProcessor(sessionManager, bridgeManager, this.tonClient, this.network);

        return {
            requestProcessor,
        };
    }

    /**
     * Initialize with provided wallets
     */
    private async initializeWallets(
        walletManager: WalletManager,
        options: TonWalletKitOptions & Required<Pick<TonWalletKitOptions, 'wallets'>>,
    ): Promise<void> {
        const results = await Promise.allSettled(
            options.wallets.map(async (walletConfig) => {
                try {
                    const wallet = await createWalletFromConfig(walletConfig, this.tonClient!);

                    const validation = validateWallet(wallet);
                    if (!validation.isValid) {
                        log.warn('Invalid wallet detected', {
                            publicKey: wallet.publicKey,
                            errors: validation.errors,
                        });
                        return;
                    }

                    await walletManager.addWallet(wallet);
                } catch (error) {
                    log.error('Failed to create wallet from config', { error });
                    throw error;
                }
            }),
        );

        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        log.info('Wallet initialization complete', { successful, failed });
    }

    /**
     * Cleanup resources during shutdown
     */
    async cleanup(components: Partial<InitializationResult>): Promise<void> {
        try {
            log.info('Cleaning up TonWalletKit components...');

            if (components.eventProcessor) {
                components.eventProcessor.stopRecoveryLoop();
                await components.eventProcessor.stopNoWalletProcessing();
            }

            if (components.bridgeManager) {
                await components.bridgeManager.close();
            }

            if (components.eventRouter) {
                components.eventRouter.clearCallbacks();
            }

            log.info('TonWalletKit cleanup completed');
        } catch (error) {
            log.error('Error during cleanup', { error });
        }
    }
}

function isWalletInterface(config: unknown): config is WalletInterface {
    return (
        typeof config === 'object' &&
        config !== null &&
        'publicKey' in config &&
        'version' in config &&
        typeof (config as WalletInterface)?.sign === 'function' &&
        typeof (config as WalletInterface)?.getAddress === 'function' &&
        typeof (config as WalletInterface)?.getStateInit === 'function'
    );
}

/**
 * Create a WalletInterface from various configuration types
 */
export async function createWalletFromConfig(config: WalletInitConfig, tonClient: ApiClient): Promise<WalletInterface> {
    let wallet: WalletInitInterface | undefined;

    // Handle mnemonic configuration
    if (
        isWalletInitConfigMnemonic(config) ||
        isWalletInitConfigPrivateKey(config) ||
        isWalletInitConfigSigner(config)
    ) {
        if (config.version === 'v5r1') {
            wallet = await createWalletV5R1(config, {
                tonClient,
            });
        } else {
            throw new Error(`Unsupported wallet version for mnemonic: ${config.version}`);
        }
    } else if (isWalletInterface(config)) {
        // If it's already a WalletInterface, use it as-is
        wallet = config as WalletInitInterface;
    }

    if (!wallet) {
        throw new Error('Unsupported wallet configuration format');
    }

    return wrapWalletInterface(wallet, tonClient);
}

// using proxy api to make wallet extension modular
export async function wrapWalletInterface(
    wallet: WalletInitInterface,
    _tonClient: ApiClient,
): Promise<WalletInterface> {
    const ourClassesToExtend = [WalletTonClass, WalletJettonClass, WalletNftClass];
    const newProxy = new Proxy(wallet, {
        get: (target, prop) => {
            if (typeof prop === 'symbol') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (target as any)[prop];
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ourMethonImplementation = ourClassesToExtend.find((cls) => !!(cls.prototype as any)[prop]);
            if (ourMethonImplementation) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const value = (ourMethonImplementation.prototype as any)[prop];
                // return ourMethonImplementation.prototype[prop].bind(target);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (...args: any[]) => value.apply(newProxy, [...args]);
            }

            // Delegate all other properties and methods to the target
            const value = (target as unknown as Record<string, unknown>)[prop];

            return value;
        },
    }) as WalletInterface;

    return newProxy;
}
