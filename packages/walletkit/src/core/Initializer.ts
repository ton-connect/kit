/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Initialization and setup logic

import type { TonWalletKitOptions } from '../types';
import { DEFAULT_DURABLE_EVENTS_CONFIG } from '../types';
import type { StorageAdapter, StorageConfig } from '../storage';
import { createStorageAdapter, Storage } from '../storage';
import { WalletManager } from './WalletManager';
import { TONConnectStoredSessionManager } from './TONConnectStoredSessionManager';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';
import { BridgeManager } from './BridgeManager';
import { EventRouter } from './EventRouter';
import { RequestProcessor } from './RequestProcessor';
import { globalLogger } from './Logger';
import type { EventEmitter } from './EventEmitter';
import { StorageEventStore } from './EventStore';
import { StorageEventProcessor } from './EventProcessor';
import { WalletTonClass } from './wallet/extensions/ton';
import { WalletJettonClass } from './wallet/extensions/jetton';
import { WalletNftClass } from './wallet/extensions/nft';
import type { AnalyticsManager } from '../analytics';
import type { NetworkManager } from './NetworkManager';
import type { Wallet, WalletAdapter } from '../api/interfaces';

const log = globalLogger.createChild('Initializer');

/**
 * Initialization result
 */
export interface InitializationResult {
    walletManager: WalletManager;
    sessionManager: TONConnectSessionManager;
    bridgeManager: BridgeManager;
    eventRouter: EventRouter;
    requestProcessor: RequestProcessor;
    storage: Storage;
    eventProcessor: StorageEventProcessor;
}

/**
 * Handles initialization of all TonWalletKit components
 */
export class Initializer {
    private config: TonWalletKitOptions;
    private networkManager!: NetworkManager;
    private eventEmitter: EventEmitter;
    private analyticsManager?: AnalyticsManager;

    constructor(config: TonWalletKitOptions, eventEmitter: EventEmitter, analyticsManager?: AnalyticsManager) {
        this.config = config;
        this.eventEmitter = eventEmitter;
        this.analyticsManager = analyticsManager;
    }

    /**
     * Initialize all components
     */
    async initialize(options: TonWalletKitOptions, networkManager: NetworkManager): Promise<InitializationResult> {
        try {
            log.info('Initializing TonWalletKit...');

            this.networkManager = networkManager;

            // 2. Initialize storage adapter
            const storage = this.initializeStorage(options);

            // 3. Initialize core managers
            const { walletManager, sessionManager, bridgeManager, eventRouter, eventProcessor } =
                await this.initializeManagers(options, storage);

            // 5. Initialize processors
            const { requestProcessor } = this.initializeProcessors(sessionManager, bridgeManager, walletManager);

            log.info('TonWalletKit initialized successfully');

            return {
                walletManager,
                sessionManager,
                bridgeManager,
                eventRouter,
                requestProcessor,
                storage,
                eventProcessor,
            };
        } catch (error) {
            log.error('Failed to initialize TonWalletKit', { error });
            throw error;
        }
    }

    /**
     * Initialize storage adapter and wrap it in Storage
     */
    private initializeStorage(options: TonWalletKitOptions): Storage {
        let adapter: StorageAdapter;

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
            adapter = options.storage;
        } else {
            const createStorageOptions = {
                prefix: (options?.storage as StorageConfig)?.prefix ?? 'tonwalletkit:',
                maxRetries: (options?.storage as StorageConfig)?.maxRetries,
                retryDelay: (options?.storage as StorageConfig)?.retryDelay,
                allowMemory: (options?.storage as StorageConfig)?.allowMemory,
            };
            adapter = createStorageAdapter(createStorageOptions);
        }

        return new Storage(adapter);
    }

    /**
     * Initialize core managers
     */
    private async initializeManagers(
        options: TonWalletKitOptions,
        storage: Storage,
    ): Promise<{
        walletManager: WalletManager;
        sessionManager: TONConnectSessionManager;
        bridgeManager: BridgeManager;
        eventRouter: EventRouter;
        eventProcessor: StorageEventProcessor;
    }> {
        // Initialize managers
        const walletManager = new WalletManager(storage);
        await walletManager.initialize();

        // Use provided session manager or create default one
        let sessionManager: TONConnectSessionManager;
        if (options.sessionManager) {
            sessionManager = options.sessionManager;
        } else {
            const storedSessionManager = new TONConnectStoredSessionManager(storage, walletManager);
            await storedSessionManager.initialize();
            sessionManager = storedSessionManager;
        }

        const eventStore = new StorageEventStore(storage);
        const eventRouter = new EventRouter(
            options,
            this.eventEmitter,
            sessionManager,
            walletManager,
            this.analyticsManager,
        );

        const bridgeManager = new BridgeManager(
            options?.walletManifest,
            options?.bridge,
            sessionManager,
            storage,
            eventStore,
            eventRouter,
            options,
            this.eventEmitter,
            this.analyticsManager,
        );
        eventRouter.setBridgeManager(bridgeManager);
        bridgeManager
            .start()
            .then(() => {
                log.info('Bridge manager started successfully');
            })
            .catch((e) => {
                log.error('Could not start bridge manager', { error: e?.toString?.() });
            });

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
        sessionManager: TONConnectSessionManager,
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
            this.analyticsManager,
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
                await components.eventProcessor.clearRegisteredWallets();
                await components.eventProcessor.stopProcessing();
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

/**
 * Wrap wallet adapter with extension interfaces (Ton, Jetton, NFT)
 * Uses proxy API to make wallet extension modular
 * The wallet adapter already contains its own ApiClient for its network
 */
export async function wrapWalletInterface(wallet: WalletAdapter): Promise<Wallet> {
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
    }) as Wallet;

    return newProxy;
}
