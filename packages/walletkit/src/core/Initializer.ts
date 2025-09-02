// Initialization and setup logic

import { TonClient } from '@ton/ton';
import { CHAIN } from '@tonconnect/protocol';

import {
    TonWalletKitOptions,
    WalletInterface,
    WalletInitConfig,
    WalletInitConfigMnemonic,
    WalletInitConfigPrivateKey,
    DEFAULT_DURABLE_EVENTS_CONFIG,
} from '../types';
import type { StorageAdapter } from '../storage';
import { createStorageAdapter } from '../storage';
import { validateWallet } from '../validation';
import { WalletManager } from './WalletManager';
import { SessionManager } from './SessionManager';
import { BridgeManager } from './BridgeManager';
import { EventRouter } from './EventRouter';
import { RequestProcessor } from './RequestProcessor';
import { ResponseHandler } from './ResponseHandler';
import { createReactNativeLogger } from './Logger';
import type { EventEmitter } from './EventEmitter';
import { createWalletV5R1 } from '../contracts/w5/WalletV5R1Adapter';
import { StorageEventStore } from './EventStore';
import { StorageEventProcessor } from './EventProcessor';

// Create React Native specific logger for better debugging
const log = createReactNativeLogger('Initializer');

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
    responseHandler: ResponseHandler;
    storageAdapter: StorageAdapter;
    tonClient: TonClient;
    eventProcessor: StorageEventProcessor;
}

/**
 * Handles initialization of all TonWalletKit components
 */
export class Initializer {
    // private config: InitializationConfig;
    private tonClient!: TonClient;
    private eventEmitter: EventEmitter;
    private network: CHAIN;
    private retryAttempts: number;
    private retryDelay: number;
    private timeoutMs: number;
    private initializationStartTime?: number;

    constructor(config: InitializationConfig = {}, eventEmitter: EventEmitter) {
        log.info('Initializer constructor called', {
            config: {
                retryAttempts: config.retryAttempts,
                retryDelay: config.retryDelay,
                timeoutMs: config.timeoutMs,
                network: config.network,
            },
            hasEventEmitter: !!eventEmitter,
            timestamp: new Date().toISOString(),
        });

        this.network = config.network ?? CHAIN.MAINNET;
        this.retryAttempts = config.retryAttempts ?? 3;
        this.retryDelay = config.retryDelay ?? 1000;
        this.timeoutMs = config.timeoutMs ?? 10000;
        this.eventEmitter = eventEmitter;

        log.debug('Initializer configuration set', {
            network: this.network,
            retryAttempts: this.retryAttempts,
            retryDelay: this.retryDelay,
            timeoutMs: this.timeoutMs,
        });
    }

    /**
     * Initialize all components
     */
    async initialize(options: TonWalletKitOptions): Promise<InitializationResult> {
        this.initializationStartTime = performance.now();
        log.startTimer('Initializer.initialize');

        try {
            log.info('Starting TonWalletKit initialization', {
                options: {
                    hasApiKey: !!options.apiKey,
                    hasApiUrl: !!options.apiUrl,
                    hasBridgeUrl: !!options.bridgeUrl,
                    hasWallets: !!options.wallets?.length,
                    hasConfig: !!options.config,
                    hasStorage: !!options.storage,
                },
                network: this.network,
                timestamp: new Date().toISOString(),
            });

            // 1. Initialize TON client first (single provider for all downstream classes)
            log.debug('Step 1: Initializing TON client');
            this.tonClient = this.initializeTonClient(options);
            log.debug('TON client initialized successfully', {
                endpoint: options.apiUrl || 'https://toncenter.com/api/v2/jsonRPC',
                hasApiKey: !!options.apiKey,
            });

            // 2. Initialize storage adapter
            log.debug('Step 2: Initializing storage adapter');
            const storageAdapter = this.initializeStorage(options);
            log.debug('Storage adapter initialized successfully', {
                hasCustomStorage: !!options.storage,
                storagePrefix: 'tonwalletkit:',
            });

            // 3. Initialize core managers
            log.debug('Step 3: Initializing core managers');
            const { walletManager, sessionManager, bridgeManager, eventRouter, eventProcessor } =
                await this.initializeManagers(options, storageAdapter);

            log.debug('Core managers initialized successfully', {
                walletManager: !!walletManager,
                sessionManager: !!sessionManager,
                bridgeManager: !!bridgeManager,
                eventRouter: !!eventRouter,
                eventProcessor: !!eventProcessor,
            });

            // 5. Initialize processors
            log.debug('Step 4: Initializing processors');
            const { requestProcessor, responseHandler } = this.initializeProcessors(sessionManager, bridgeManager);

            log.debug('Processors initialized successfully', {
                requestProcessor: !!requestProcessor,
                responseHandler: !!responseHandler,
            });

            const initializationDuration = performance.now() - (this.initializationStartTime || 0);
            log.info('TonWalletKit initialization completed successfully', {
                duration: `${initializationDuration.toFixed(2)}ms`,
                timestamp: new Date().toISOString(),
                components: {
                    tonClient: !!this.tonClient,
                    storageAdapter: !!storageAdapter,
                    walletManager: !!walletManager,
                    sessionManager: !!sessionManager,
                    bridgeManager: !!bridgeManager,
                    eventRouter: !!eventRouter,
                    eventProcessor: !!eventProcessor,
                    requestProcessor: !!requestProcessor,
                    responseHandler: !!responseHandler,
                },
            });

            return {
                walletManager,
                sessionManager,
                bridgeManager,
                eventRouter,
                requestProcessor,
                responseHandler,
                storageAdapter,
                tonClient: this.tonClient,
                eventProcessor,
            };
        } catch (error) {
            const initializationDuration = performance.now() - (this.initializationStartTime || 0);
            log.critical(
                'Failed to initialize TonWalletKit',
                {
                    error,
                    duration: `${initializationDuration.toFixed(2)}ms`,
                    timestamp: new Date().toISOString(),
                    options: {
                        hasApiKey: !!options.apiKey,
                        hasApiUrl: !!options.apiUrl,
                        hasBridgeUrl: !!options.bridgeUrl,
                        hasWallets: !!options.wallets?.length,
                        hasConfig: !!options.config,
                        hasStorage: !!options.storage,
                    },
                    network: this.network,
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('Initializer.initialize');
        }
    }

    /**
     * Initialize TON client (single provider for all downstream classes)
     */
    private initializeTonClient(options: TonWalletKitOptions): TonClient {
        log.startTimer('Initializer.initializeTonClient');

        try {
            // Use provided API URL or default to mainnet
            const endpoint = options.apiUrl || 'https://toncenter.com/api/v2/jsonRPC';

            const clientConfig: ConstructorParameters<typeof TonClient>[0] = {
                endpoint,
            };

            // Add API key if provided
            if (options.apiKey) {
                clientConfig.apiKey = options.apiKey;
                log.debug('API key provided for TON client');
            } else {
                log.debug('No API key provided, using public endpoint');
            }

            log.debug('Creating TON client with config', {
                endpoint,
                hasApiKey: !!options.apiKey,
            });

            const tonClient = new TonClient(clientConfig);

            log.info('TON client created successfully', {
                endpoint,
                hasApiKey: !!options.apiKey,
            });

            return tonClient;
        } catch (error) {
            log.error(
                'Failed to initialize TON client',
                {
                    options: {
                        hasApiKey: !!options.apiKey,
                        hasApiUrl: !!options.apiUrl,
                    },
                    error,
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('Initializer.initializeTonClient');
        }
    }

    /**
     * Initialize storage adapter
     */
    private initializeStorage(options: TonWalletKitOptions): StorageAdapter {
        log.startTimer('Initializer.initializeStorage');

        try {
            if (options.storage) {
                log.debug('Using custom storage adapter provided in options');
                return options.storage;
            }

            log.debug('Creating default storage adapter');
            const storageAdapter = createStorageAdapter({
                prefix: 'tonwalletkit:',
            });

            log.info('Storage adapter initialized successfully', {
                type: 'default',
                prefix: 'tonwalletkit:',
            });

            return storageAdapter;
        } catch (error) {
            log.error('Failed to initialize storage adapter', { error });
            throw error;
        } finally {
            log.endTimer('Initializer.initializeStorage');
        }
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
        log.startTimer('Initializer.initializeManagers');

        try {
            // Initialize managers
            log.debug('Creating WalletManager');
            const walletManager = new WalletManager(storageAdapter);

            log.debug('Initializing WalletManager');
            await walletManager.initialize();
            log.debug('WalletManager initialized successfully');

            // 4. Initialize with provided wallets
            if (options.wallets && options.wallets.length > 0) {
                log.debug('Initializing wallets from options', {
                    walletCount: options.wallets.length,
                });

                await this.initializeWallets(walletManager, {
                    ...options,
                    wallets: options.wallets,
                });
            } else {
                log.debug('No wallets provided in options, skipping wallet initialization');
            }

            log.debug('Creating SessionManager');
            const sessionManager = new SessionManager(storageAdapter, walletManager);

            log.debug('Initializing SessionManager');
            await sessionManager.initialize();
            log.debug('SessionManager initialized successfully');

            log.debug('Creating StorageEventStore');
            const eventStore = new StorageEventStore(storageAdapter);
            log.debug('StorageEventStore created successfully');

            log.debug('Creating BridgeManager');
            const bridgeManager = new BridgeManager(
                {
                    bridgeUrl: options.bridgeUrl,
                },
                sessionManager,
                storageAdapter,
                eventStore,
                this.eventEmitter,
            );

            log.debug('Starting BridgeManager');
            await bridgeManager.start();
            log.debug('BridgeManager started successfully');

            log.debug('Creating EventRouter');
            const eventRouter = new EventRouter(this.eventEmitter, sessionManager);
            log.debug('EventRouter created successfully');

            // Create event processor for durable events
            // TODO - change default values
            log.debug('Creating StorageEventProcessor');
            const eventProcessor = new StorageEventProcessor(
                eventStore,
                DEFAULT_DURABLE_EVENTS_CONFIG,
                walletManager,
                sessionManager,
                eventRouter,
                this.eventEmitter,
            );
            log.debug('StorageEventProcessor created successfully');

            log.info('All core managers initialized successfully', {
                walletManager: !!walletManager,
                sessionManager: !!sessionManager,
                bridgeManager: !!bridgeManager,
                eventRouter: !!eventRouter,
                eventProcessor: !!eventProcessor,
            });

            return {
                walletManager,
                sessionManager,
                bridgeManager,
                eventRouter,
                eventProcessor,
            };
        } catch (error) {
            log.error('Failed to initialize core managers', { error });
            throw error;
        } finally {
            log.endTimer('Initializer.initializeManagers');
        }
    }

    /**
     * Initialize processors
     */
    private initializeProcessors(
        sessionManager: SessionManager,
        bridgeManager: BridgeManager,
    ): {
        requestProcessor: RequestProcessor;
        responseHandler: ResponseHandler;
    } {
        log.startTimer('Initializer.initializeProcessors');

        try {
            log.debug('Creating RequestProcessor');
            const requestProcessor = new RequestProcessor(sessionManager, bridgeManager, this.tonClient, this.network);
            log.debug('RequestProcessor created successfully');

            log.debug('Creating ResponseHandler');
            const responseHandler = new ResponseHandler(bridgeManager, sessionManager);
            log.debug('ResponseHandler created successfully');

            log.info('Processors initialized successfully', {
                requestProcessor: !!requestProcessor,
                responseHandler: !!responseHandler,
            });

            return {
                requestProcessor,
                responseHandler,
            };
        } catch (error) {
            log.error('Failed to initialize processors', { error });
            throw error;
        } finally {
            log.endTimer('Initializer.initializeProcessors');
        }
    }

    /**
     * Initialize with provided wallets
     */
    private async initializeWallets(
        walletManager: WalletManager,
        options: TonWalletKitOptions & Required<Pick<TonWalletKitOptions, 'wallets'>>,
    ): Promise<void> {
        log.startTimer('Initializer.initializeWallets');

        try {
            log.info('Starting wallet initialization', {
                walletCount: options.wallets.length,
                walletTypes: options.wallets.map((w) => w.constructor.name),
            });

            const results = await Promise.allSettled(
                options.wallets.map(async (walletConfig, index) => {
                    try {
                        log.debug(`Initializing wallet ${index + 1}/${options.wallets.length}`, {
                            walletType: walletConfig.constructor.name,
                            hasMnemonic: 'mnemonic' in walletConfig,
                            hasPrivateKey: 'privateKey' in walletConfig,
                            version: 'version' in walletConfig ? walletConfig.version : 'unknown',
                        });

                        const wallet = await createWalletFromConfig(walletConfig, this.tonClient!);

                        log.debug(`Wallet ${index + 1} created from config`, {
                            walletAddress: wallet.getAddress(),
                            walletVersion: wallet.version,
                            hasPublicKey: !!wallet.publicKey,
                        });

                        const validation = validateWallet(wallet);
                        if (!validation.isValid) {
                            log.warn(`Wallet ${index + 1} validation failed`, {
                                publicKey: wallet.publicKey,
                                errors: validation.errors,
                                walletAddress: wallet.getAddress(),
                            });
                            return;
                        }

                        log.debug(`Adding wallet ${index + 1} to manager`);
                        await walletManager.addWallet(wallet);

                        log.debug(`Wallet ${index + 1} added successfully`, {
                            walletAddress: wallet.getAddress(),
                            walletVersion: wallet.version,
                        });
                    } catch (error) {
                        log.error(`Failed to create wallet ${index + 1} from config`, {
                            walletConfig: {
                                type: walletConfig.constructor.name,
                                hasMnemonic: 'mnemonic' in walletConfig,
                                hasPrivateKey: 'privateKey' in walletConfig,
                                version: 'version' in walletConfig ? walletConfig.version : 'unknown',
                            },
                            error,
                        });
                        throw error;
                    }
                }),
            );

            const successful = results.filter((r) => r.status === 'fulfilled').length;
            const failed = results.filter((r) => r.status === 'rejected').length;

            log.info('Wallet initialization complete', {
                successful,
                failed,
                total: options.wallets.length,
                successRate: `${((successful / options.wallets.length) * 100).toFixed(1)}%`,
            });

            if (failed > 0) {
                log.warn('Some wallets failed to initialize', {
                    failed,
                    successful,
                    total: options.wallets.length,
                });
            }
        } catch (error) {
            log.error('Wallet initialization failed', { error });
            throw error;
        } finally {
            log.endTimer('Initializer.initializeWallets');
        }
    }

    /**
     * Cleanup resources during shutdown
     */
    async cleanup(components: Partial<InitializationResult>): Promise<void> {
        log.startTimer('Initializer.cleanup');

        try {
            log.info('Starting TonWalletKit components cleanup', {
                hasEventProcessor: !!components.eventProcessor,
                hasBridgeManager: !!components.bridgeManager,
                hasEventRouter: !!components.eventRouter,
                timestamp: new Date().toISOString(),
            });

            if (components.eventProcessor) {
                log.debug('Stopping event processor recovery loop');
                components.eventProcessor.stopRecoveryLoop();
                log.debug('Event processor recovery loop stopped');
            }

            if (components.bridgeManager) {
                log.debug('Closing bridge manager');
                await components.bridgeManager.close();
                log.debug('Bridge manager closed');
            }

            if (components.eventRouter) {
                log.debug('Clearing event router callbacks');
                components.eventRouter.clearCallbacks();
                log.debug('Event router callbacks cleared');
            }

            log.info('TonWalletKit cleanup completed successfully');
        } catch (error) {
            log.error('Error during cleanup', { error });
            throw error;
        } finally {
            log.endTimer('Initializer.cleanup');
        }
    }

    /**
     * Get initialization performance metrics
     */
    getPerformanceMetrics(): {
        initializationStartTime: number | undefined;
        currentTime: number;
        initializationDuration: number | undefined;
        timestamp: string;
    } {
        const currentTime = performance.now();
        const initializationDuration = this.initializationStartTime
            ? currentTime - this.initializationStartTime
            : undefined;

        const metrics = {
            initializationStartTime: this.initializationStartTime,
            currentTime,
            initializationDuration,
            timestamp: new Date().toISOString(),
        };

        log.debug('Getting initialization performance metrics', metrics);
        return metrics;
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
        typeof (config as WalletInterface)?.getBalance === 'function' &&
        typeof (config as WalletInterface)?.getStateInit === 'function'
    );
}

/**
 * Create a WalletInterface from various configuration types
 */
export async function createWalletFromConfig(config: WalletInitConfig, tonClient: TonClient): Promise<WalletInterface> {
    log.startTimer('createWalletFromConfig');

    try {
        log.debug('Creating wallet from config', {
            configType: config.constructor.name,
            hasMnemonic: 'mnemonic' in config,
            hasPrivateKey: 'privateKey' in config,
            version: 'version' in config ? config.version : 'unknown',
        });

        // Handle mnemonic configuration
        if (config instanceof WalletInitConfigMnemonic) {
            if (config.version === 'v5r1') {
                log.debug('Creating v5r1 wallet from mnemonic');
                const wallet = await createWalletV5R1(config, { tonClient });

                log.debug('v5r1 wallet created successfully from mnemonic', {
                    walletAddress: wallet.getAddress(),
                    walletVersion: wallet.version,
                });

                return wallet;
            }
            throw new Error(`Unsupported wallet version for mnemonic: ${config.version}`);
        }

        // Handle private key configuration - check for publicKey but not mnemonic
        if (config instanceof WalletInitConfigPrivateKey) {
            if (config.version === 'v5r1') {
                log.debug('Creating v5r1 wallet from private key');
                const wallet = await createWalletV5R1(config, { tonClient });

                log.debug('v5r1 wallet created successfully from private key', {
                    walletAddress: wallet.getAddress(),
                    walletVersion: wallet.version,
                });

                return wallet;
            }
            throw new Error(`Unsupported wallet version for private key: ${config.version}`);
        }

        // If it's already a WalletInterface, return as-is
        if (isWalletInterface(config)) {
            log.debug('Config is already a WalletInterface, returning as-is', {
                walletAddress: (config as WalletInterface).getAddress(),
                walletVersion: (config as WalletInterface).version,
            });
            return config as WalletInterface;
        }

        throw new Error('Unsupported wallet configuration format');
    } catch (error) {
        log.error(
            'Failed to create wallet from config',
            {
                configType: config.constructor.name,
                hasMnemonic: 'mnemonic' in config,
                hasPrivateKey: 'privateKey' in config,
                version: 'version' in config ? config.version : 'unknown',
                error,
            },
            error instanceof Error ? error : new Error(String(error)),
        );
        throw error;
    } finally {
        log.endTimer('createWalletFromConfig');
    }
}
