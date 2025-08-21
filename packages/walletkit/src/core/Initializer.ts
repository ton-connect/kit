// Initialization and setup logic

import { TonClient } from '@ton/ton';

import {
    TonWalletKitOptions,
    WalletInterface,
    WalletInitConfig,
    WalletInitConfigMnemonic,
    WalletInitConfigPrivateKey,
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
import { globalLogger } from './Logger';
import { createWalletV5R1 } from '../contracts/w5/WalletV5R1Adapter';

const log = globalLogger.createChild('Initializer');

/**
 * Initialization configuration
 */
export interface InitializationConfig {
    retryAttempts?: number;
    retryDelay?: number;
    timeoutMs?: number;
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
}

/**
 * Handles initialization of all TonWalletKit components
 */
export class Initializer {
    private config: InitializationConfig;
    private tonClient!: TonClient;

    constructor(config: InitializationConfig = {}) {
        this.config = {
            retryAttempts: 3,
            retryDelay: 1000,
            timeoutMs: 10000,
            ...config,
        };

        // TonClient and wallet initializers will be created in initialize() with proper options
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
            const { walletManager, sessionManager, bridgeManager, eventRouter } = await this.initializeManagers(
                options,
                storageAdapter,
            );

            // 5. Initialize processors
            const { requestProcessor, responseHandler } = this.initializeProcessors(sessionManager, bridgeManager);

            // 6. Configure event routing
            this.configureEventRouting(bridgeManager, eventRouter);

            log.info('TonWalletKit initialized successfully');

            return {
                walletManager,
                sessionManager,
                bridgeManager,
                eventRouter,
                requestProcessor,
                responseHandler,
                storageAdapter,
                tonClient: this.tonClient,
            };
        } catch (error) {
            log.error('Failed to initialize TonWalletKit', { error });
            throw error;
        }
    }

    /**
     * Initialize TON client (single provider for all downstream classes)
     */
    private initializeTonClient(options: TonWalletKitOptions): TonClient {
        // Use provided API URL or default to mainnet
        const endpoint = options.apiUrl || 'https://toncenter.com/api/v2/jsonRPC';

        const clientConfig: ConstructorParameters<typeof TonClient>[0] = {
            endpoint,
        };

        // Add API key if provided
        if (options.apiKey) {
            clientConfig.apiKey = options.apiKey;
        }

        return new TonClient(clientConfig);
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

        const bridgeManager = new BridgeManager(
            {
                bridgeUrl: options.bridgeUrl,
            },
            sessionManager,
            storageAdapter,
        );
        await bridgeManager.initialize();

        const eventRouter = new EventRouter();

        return {
            walletManager,
            sessionManager,
            bridgeManager,
            eventRouter,
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
        responseHandler: ResponseHandler;
    } {
        const requestProcessor = new RequestProcessor(sessionManager, bridgeManager, this.tonClient);
        const responseHandler = new ResponseHandler(bridgeManager, sessionManager);

        return {
            requestProcessor,
            responseHandler,
        };
    }

    /**
     * Configure event routing from bridge to router
     */
    private configureEventRouting(bridgeManager: BridgeManager, _eventRouter: EventRouter): void {
        bridgeManager.setEventCallback(async (event) => {
            // The event routing will be handled by the main TonWalletKit class
            // This is just setting up the bridge callback
            log.debug('Bridge event received', { method: event.method });
            _eventRouter.routeEvent(event);
        });
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
        typeof (config as WalletInterface)?.getBalance === 'function' &&
        typeof (config as WalletInterface)?.getStateInit === 'function'
    );
}

/**
 * Create a WalletInterface from various configuration types
 */
export async function createWalletFromConfig(config: WalletInitConfig, tonClient: TonClient): Promise<WalletInterface> {
    // Handle mnemonic configuration
    if (config instanceof WalletInitConfigMnemonic) {
        if (config.version === 'v5r1') {
            return createWalletV5R1(config, {
                tonClient,
            });
        }
        throw new Error(`Unsupported wallet version for mnemonic: ${config.version}`);
    }

    // Handle private key configuration - check for publicKey but not mnemonic
    if (config instanceof WalletInitConfigPrivateKey) {
        if (config.version === 'v5r1') {
            return createWalletV5R1(config, {
                tonClient,
            });
        }
        throw new Error(`Unsupported wallet version for private key: ${config.version}`);
    }

    // If it's already a WalletInterface, return as-is
    if (isWalletInterface(config)) {
        return config as WalletInterface;
    }

    throw new Error('Unsupported wallet configuration format');
}
