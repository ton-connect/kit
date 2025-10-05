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
import { AnalyticsApi } from '../analytics/sender';
import { WalletKitError, ERROR_CODES } from '../errors';
import { createWalletV4R2 } from '../contracts/v4r2/WalletV4R2Adapter';

const log = globalLogger.createChild('Initializer');

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
    private config: TonWalletKitOptions;
    private tonClient!: ApiClient;
    private eventEmitter: EventEmitter;
    private analyticsApi?: AnalyticsApi;

    constructor(config: TonWalletKitOptions, eventEmitter: EventEmitter, analyticsApi?: AnalyticsApi) {
        this.config = config;
        this.eventEmitter = eventEmitter;
        this.analyticsApi = analyticsApi;
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
            const { requestProcessor } = this.initializeProcessors(sessionManager, bridgeManager, walletManager);

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
        if (
            options.apiClient &&
            'nftItemsByAddress' in options.apiClient &&
            'nftItemsByOwner' in options.apiClient &&
            'fetchEmulation' in options.apiClient &&
            'sendBoc' in options.apiClient &&
            'runGetMethod' in options.apiClient &&
            'getAccountState' in options.apiClient &&
            'getBalance' in options.apiClient
        ) {
            return options.apiClient;
        }

        const defaultEndpoint =
            options?.network === CHAIN.MAINNET ? 'https://toncenter.com' : 'https://testnet.toncenter.com';
        // Use provided API URL or default to mainnet
        const endpoint = options?.apiClient?.url || defaultEndpoint;

        const clientConfig = {
            endpoint,
            apiKey: options?.apiClient?.key,
            network: options?.network,
        };

        return new ApiClientToncenter(clientConfig);
    }

    /**
     * Initialize storage adapter
     */
    private initializeStorage(options: TonWalletKitOptions): StorageAdapter {
        if (
            options.storage &&
            'get' in options.storage &&
            typeof options.storage.get === 'function' &&
            'set' in options.storage &&
            typeof options.storage.set === 'function' &&
            'remove' in options.storage &&
            typeof options.storage.remove === 'function' &&
            'clear' in options.storage &&
            typeof options.storage.clear === 'function'
        ) {
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

        const sessionManager = new SessionManager(storageAdapter, walletManager);
        await sessionManager.initialize();

        const eventStore = new StorageEventStore(storageAdapter);
        const eventRouter = new EventRouter(this.eventEmitter, sessionManager, walletManager);

        const bridgeManager = new BridgeManager(
            options?.walletManifest,
            options?.bridge,
            sessionManager,
            storageAdapter,
            eventStore,
            eventRouter,
            this.eventEmitter,
        );
        eventRouter.setBridgeManager(bridgeManager);
        await bridgeManager.start();

        // Create event processor for durable events
        // TODO - change default values
        const eventProcessor = new StorageEventProcessor(
            options?.eventProcessor,
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
        walletManager: WalletManager,
    ): {
        requestProcessor: RequestProcessor;
    } {
        const requestProcessor = new RequestProcessor(
            this.config,
            sessionManager,
            bridgeManager,
            walletManager,
            this.tonClient,
            this.config.network === CHAIN.MAINNET ? CHAIN.MAINNET : CHAIN.TESTNET,
            this.analyticsApi,
        );

        return {
            requestProcessor,
        };
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
        } else if (config.version === 'v4r2') {
            wallet = await createWalletV4R2(config, {
                tonClient,
            });
        } else {
            throw new WalletKitError(
                ERROR_CODES.WALLET_CREATION_FAILED,
                `Unsupported wallet version: ${config.version}`,
                undefined,
                { version: config.version, configType: 'mnemonic' },
            );
        }
    }
    // else if (isWalletInitConfigLedger(config)) {
    //     // Handle Ledger configuration
    //     if (config.version === 'v4r2') {
    //         wallet = await createWalletV4R2Ledger(config, {
    //             tonClient,
    //         });
    //     } else {
    //         throw new Error(`Unsupported wallet version for Ledger: ${config.version}`);
    //     }
    else if (isWalletInterface(config)) {
        // If it's already a WalletInterface, use it as-is
        wallet = config as WalletInitInterface;
    }

    if (!wallet) {
        throw new WalletKitError(
            ERROR_CODES.WALLET_CREATION_FAILED,
            'Unsupported wallet configuration format',
            undefined,
            { config },
        );
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
