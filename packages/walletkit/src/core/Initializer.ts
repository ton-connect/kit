/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Initialization and setup logic

import { CHAIN } from '@tonconnect/protocol';

import { TonWalletKitOptions, IWallet, DEFAULT_DURABLE_EVENTS_CONFIG } from '../types';
import type { StorageAdapter, StorageConfig } from '../storage';
import { createStorageAdapter } from '../storage';
import { WalletManager } from './WalletManager';
import { SessionManager } from './SessionManager';
import { BridgeManager } from './BridgeManager';
import { EventRouter } from './EventRouter';
import { RequestProcessor } from './RequestProcessor';
import { globalLogger } from './Logger';
import type { EventEmitter } from './EventEmitter';
import { StorageEventStore } from './EventStore';
import { StorageEventProcessor } from './EventProcessor';
import { IWalletAdapter } from '../types/wallet';
import { WalletTonClass } from './wallet/extensions/ton';
import { WalletJettonClass } from './wallet/extensions/jetton';
import { WalletNftClass } from './wallet/extensions/nft';
import { ApiClient } from '../types/toncenter/ApiClient';
import { AnalyticsApi } from '../analytics/sender';

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
    async initialize(options: TonWalletKitOptions, tonClient: ApiClient): Promise<InitializationResult> {
        try {
            log.info('Initializing TonWalletKit...');

            this.tonClient = tonClient;

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
                eventProcessor,
            };
        } catch (error) {
            log.error('Failed to initialize TonWalletKit', { error });
            throw error;
        }
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

        const createStorageOptions = {
            prefix: (options?.storage as StorageConfig)?.prefix ?? 'tonwalletkit:',
            maxRetries: (options?.storage as StorageConfig)?.maxRetries,
            retryDelay: (options?.storage as StorageConfig)?.retryDelay,
            allowMemory: (options?.storage as StorageConfig)?.allowMemory,
        };
        return createStorageAdapter(createStorageOptions);
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
        const eventRouter = new EventRouter(
            this.eventEmitter,
            sessionManager,
            walletManager,
            this.config,
            this.analyticsApi,
        );

        const bridgeManager = new BridgeManager(
            options?.walletManifest,
            options?.bridge,
            sessionManager,
            storageAdapter,
            eventStore,
            eventRouter,
            options,
            this.eventEmitter,
            this.analyticsApi,
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

// using proxy api to make wallet extension modular
export async function wrapWalletInterface(wallet: IWalletAdapter, _tonClient: ApiClient): Promise<IWallet> {
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
    }) as IWallet;

    return newProxy;
}
