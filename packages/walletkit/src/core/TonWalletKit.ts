// Minimal TonWalletKit - Pure orchestration layer

import type { TonClient } from '@ton/ton';
import { ConnectRequest, DisconnectEvent } from '@tonconnect/protocol';

import type {
    TonWalletKit as ITonWalletKit,
    TonWalletKitOptions,
    WalletInterface,
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventDisconnect,
    WalletInitConfig,
} from '../types';
import { createWalletFromConfig, Initializer, type InitializationResult } from './Initializer';
import { createReactNativeLogger } from './Logger';
import type { WalletManager } from './WalletManager';
import type { SessionManager } from './SessionManager';
import type { EventRouter } from './EventRouter';
import type { RequestProcessor } from './RequestProcessor';
import type { ResponseHandler } from './ResponseHandler';
import { JettonsManager } from './JettonsManager';
import type { JettonsAPI } from '../types/jettons';
import { RawBridgeEventConnect } from '../types/internal';
import { EventEmitter } from './EventEmitter';
import { StorageEventProcessor } from './EventProcessor';
import { BridgeManager } from './BridgeManager';
import type { BridgeRequest } from '../types/jsBridge';
import { JSBridgeManager } from '../bridge/JSBridgeManager';

// Create React Native specific logger for better debugging
const log = createReactNativeLogger('TonWalletKit');

/**
 * Minimal TonWalletKit implementation - pure orchestration
 *
 * This class delegates all actual work to specialized components:
 * - WalletManager: wallet CRUD operations
 * - SessionManager: session lifecycle
 * - EventRouter: event parsing & routing
 * - RequestProcessor: request approval/rejection
 * - ResponseHandler: response formatting & sending
 * - Initializer: component setup & teardown
 */
export class TonWalletKit implements ITonWalletKit {
    // Component references
    private walletManager!: WalletManager;
    private sessionManager!: SessionManager;
    private eventRouter!: EventRouter;
    private requestProcessor!: RequestProcessor;
    private responseHandler!: ResponseHandler;
    private tonClient!: TonClient;
    private jettonsManager: JettonsManager;
    private initializer: Initializer;
    private eventProcessor!: StorageEventProcessor;
    private bridgeManager!: BridgeManager;
    private jsBridgeManager?: JSBridgeManager;

    // Event emitter for this kit instance
    private eventEmitter: EventEmitter;

    // State
    private isInitialized = false;
    private initializationPromise?: Promise<void>;
    private initializationStartTime?: number;

    constructor(options: TonWalletKitOptions) {
        log.info('TonWalletKit constructor called', {
            options: {
                hasApiKey: !!options.apiKey,
                hasApiUrl: !!options.apiUrl,
                hasBridgeUrl: !!options.bridgeUrl,
                hasWallets: !!options.wallets?.length,
                hasConfig: !!options.config,
                hasStorage: !!options.storage,
            },
            timestamp: new Date().toISOString(),
        });

        this.eventEmitter = new EventEmitter();
        this.initializer = new Initializer({}, this.eventEmitter);
        this.jettonsManager = new JettonsManager(10000, this.eventEmitter, options.apiKey);

        log.debug('Components created', {
            eventEmitter: !!this.eventEmitter,
            initializer: !!this.initializer,
            jettonsManager: !!this.jettonsManager,
        });

        // Auto-initialize (lazy)
        this.initializationPromise = this.initialize(options);
    }

    // === Initialization ===

    /**
     * Initialize all components
     */
    private async initialize(options: TonWalletKitOptions): Promise<void> {
        if (this.isInitialized) {
            log.warn('TonWalletKit already initialized, skipping');
            return;
        }

        this.initializationStartTime = performance.now();
        log.startTimer('TonWalletKit.initialize');

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
                timestamp: new Date().toISOString(),
            });

            const components = await this.initializer.initialize(options);

            log.debug('Initializer completed successfully', {
                components: {
                    walletManager: !!components.walletManager,
                    sessionManager: !!components.sessionManager,
                    eventRouter: !!components.eventRouter,
                    requestProcessor: !!components.requestProcessor,
                    responseHandler: !!components.responseHandler,
                    tonClient: !!components.tonClient,
                    eventProcessor: !!components.eventProcessor,
                    bridgeManager: !!components.bridgeManager,
                },
            });

            this.assignComponents(components);
            this.setupEventRouting();

            // Start the event processor recovery loop
            log.debug('Starting event processor recovery loop');
            this.eventProcessor.startRecoveryLoop();

            if (options.config?.jsBridgeOptions) {
                log.info('Initializing JS Bridge Manager', {
                    jsBridgeOptions: options.config.jsBridgeOptions,
                });

                this.jsBridgeManager = new JSBridgeManager(
                    this.eventRouter,
                    this.sessionManager,
                    this.walletManager,
                    options.config.jsBridgeOptions,
                );

                log.debug('JS Bridge Manager created, starting...');
                await this.jsBridgeManager.start();
                log.info('JS Bridge Manager started successfully');
            } else {
                log.debug('JS Bridge Manager not configured, skipping');
            }

            this.isInitialized = true;

            const initializationDuration = performance.now() - (this.initializationStartTime || 0);
            log.info('TonWalletKit initialization completed successfully', {
                duration: `${initializationDuration.toFixed(2)}ms`,
                timestamp: new Date().toISOString(),
                components: {
                    walletManager: !!this.walletManager,
                    sessionManager: !!this.sessionManager,
                    eventRouter: !!this.eventRouter,
                    requestProcessor: !!this.requestProcessor,
                    responseHandler: !!this.responseHandler,
                    tonClient: !!this.tonClient,
                    eventProcessor: !!this.eventProcessor,
                    bridgeManager: !!this.bridgeManager,
                    jsBridgeManager: !!this.jsBridgeManager,
                },
            });
        } catch (error) {
            const initializationDuration = performance.now() - (this.initializationStartTime || 0);
            log.critical(
                'TonWalletKit initialization failed',
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
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('TonWalletKit.initialize');
        }
    }

    /**
     * Assign initialized components
     */
    private assignComponents(components: InitializationResult): void {
        log.debug('Assigning initialized components');

        this.walletManager = components.walletManager;
        this.sessionManager = components.sessionManager;
        this.eventRouter = components.eventRouter;
        this.requestProcessor = components.requestProcessor;
        this.responseHandler = components.responseHandler;
        this.tonClient = components.tonClient;
        this.eventProcessor = components.eventProcessor;
        this.bridgeManager = components.bridgeManager;

        log.debug('Components assigned successfully', {
            walletManager: !!this.walletManager,
            sessionManager: !!this.sessionManager,
            eventRouter: !!this.eventRouter,
            requestProcessor: !!this.requestProcessor,
            responseHandler: !!this.responseHandler,
            tonClient: !!this.tonClient,
            eventProcessor: !!this.eventProcessor,
            bridgeManager: !!this.bridgeManager,
        });
    }

    /**
     * Setup event routing from bridge to handlers
     */
    private setupEventRouting(): void {
        log.debug('Setting up event routing');

        // The event routing logic will use the existing EventRouter
        // but integrate with our new ResponseHandler for error cases

        // Start event processing for existing wallets
        this.startProcessingForExistingWallets();
    }

    /**
     * Start event processing for all existing wallets
     */
    private async startProcessingForExistingWallets(): Promise<void> {
        const wallets = this.walletManager.getWallets();
        log.debug('Starting event processing for existing wallets', {
            walletCount: wallets.length,
            walletAddresses: wallets.map((w) => w.getAddress()),
        });

        for (const wallet of wallets) {
            try {
                const walletAddress = wallet.getAddress();
                log.debug('Starting event processing for wallet', { walletAddress });

                await this.eventProcessor.startProcessing(walletAddress);

                log.debug('Event processing started successfully for wallet', { walletAddress });
            } catch (error) {
                log.error(
                    'Failed to start event processing for wallet',
                    {
                        walletAddress: wallet.getAddress(),
                        error,
                    },
                    error instanceof Error ? error : new Error(String(error)),
                );
            }
        }
    }

    /**
     * Ensure initialization is complete
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            log.debug('Waiting for initialization to complete');

            if (this.initializationPromise) {
                try {
                    await this.initializationPromise;
                    log.debug('Initialization completed, proceeding');
                } catch (error) {
                    log.error('Initialization promise failed', { error });
                    throw error;
                }
            } else {
                log.warn('No initialization promise found, this should not happen');
            }
        }
    }

    // === Wallet Management API (Delegated) ===

    getWallets(): WalletInterface[] {
        if (!this.isInitialized) {
            log.warn('TonWalletKit not yet initialized, returning empty array');
            return [];
        }

        const wallets = this.walletManager.getWallets();
        log.debug('Getting wallets', {
            walletCount: wallets.length,
            walletAddresses: wallets.map((w) => w.getAddress()),
        });

        return wallets;
    }

    /**
     * Get wallet by address
     */
    getWallet(address: string): WalletInterface | undefined {
        if (!this.isInitialized) {
            log.warn('TonWalletKit not yet initialized, returning undefined');
            return undefined;
        }

        const wallet = this.walletManager.getWallet(address);
        log.debug('Getting wallet by address', {
            address,
            found: !!wallet,
            walletAddress: wallet?.getAddress(),
        });

        return wallet;
    }

    async addWallet(walletConfig: WalletInitConfig): Promise<void> {
        log.startTimer('TonWalletKit.addWallet');

        try {
            await this.ensureInitialized();

            log.debug('Adding wallet', {
                walletConfigType: walletConfig.constructor.name,
                hasMnemonic: 'mnemonic' in walletConfig,
                hasPrivateKey: 'privateKey' in walletConfig,
                version: 'version' in walletConfig ? walletConfig.version : 'unknown',
            });

            const wallet = await createWalletFromConfig(walletConfig, this.tonClient);

            log.debug('Wallet created from config', {
                walletAddress: wallet.getAddress(),
                walletVersion: wallet.version,
                hasPublicKey: !!wallet.publicKey,
            });

            const walletAdded = await this.walletManager.addWallet(wallet);

            log.debug('Wallet added to manager', {
                walletAddress: wallet.getAddress(),
                wasAdded: walletAdded,
            });

            // wallet already exists
            if (!walletAdded) {
                log.info('Wallet already exists, skipping event processing setup');
                return;
            }

            // Start event processing for the new wallet
            log.debug('Starting event processing for new wallet', {
                walletAddress: wallet.getAddress(),
            });

            await this.eventProcessor.startProcessing(wallet.getAddress());

            log.info('Wallet added successfully', {
                walletAddress: wallet.getAddress(),
                walletVersion: wallet.version,
            });
        } catch (error) {
            log.error(
                'Failed to add wallet',
                {
                    walletConfig: {
                        type: walletConfig.constructor.name,
                        hasMnemonic: 'mnemonic' in walletConfig,
                        hasPrivateKey: 'privateKey' in walletConfig,
                        version: 'version' in walletConfig ? walletConfig.version : 'unknown',
                    },
                    error,
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('TonWalletKit.addWallet');
        }
    }

    async removeWallet(wallet: WalletInterface): Promise<void> {
        log.startTimer('TonWalletKit.removeWallet');

        try {
            await this.ensureInitialized();

            const walletAddress = wallet.getAddress();
            log.debug('Removing wallet', { walletAddress });

            // Stop event processing for the wallet
            await this.eventProcessor.stopProcessing(walletAddress);

            await this.walletManager.removeWallet(wallet);

            log.info('Wallet removed successfully', { walletAddress });
        } catch (error) {
            log.error(
                'Failed to remove wallet',
                {
                    walletAddress: wallet.getAddress(),
                    error,
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('TonWalletKit.removeWallet');
        }
    }

    async clearWallets(): Promise<void> {
        log.startTimer('TonWalletKit.clearWallets');

        try {
            await this.ensureInitialized();

            const wallets = this.walletManager.getWallets();
            log.debug('Clearing all wallets', { walletCount: wallets.length });

            // Stop event processing for all wallets
            for (const wallet of wallets) {
                try {
                    await this.eventProcessor.stopProcessing(wallet.getAddress());
                } catch (error) {
                    log.warn('Failed to stop event processing for wallet during clear', {
                        walletAddress: wallet.getAddress(),
                        error,
                    });
                }
            }

            await this.walletManager.clearWallets();
            await this.sessionManager.clearSessions();

            log.info('All wallets cleared successfully');
        } catch (error) {
            log.error('Failed to clear wallets', { error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.clearWallets');
        }
    }

    // === Session Management API (Delegated) ===

    async disconnect(sessionId?: string): Promise<void> {
        log.startTimer('TonWalletKit.disconnect');

        try {
            await this.ensureInitialized();

            const removeSession = async (sessionId: string) => {
                log.debug('Removing session', { sessionId });

                await this.bridgeManager.sendResponse(sessionId, null, {
                    event: 'disconnect',
                    id: Date.now(),
                    payload: {},
                } as DisconnectEvent);

                await this.sessionManager.removeSession(sessionId);

                log.debug('Session removed successfully', { sessionId });
            };

            if (sessionId) {
                try {
                    await removeSession(sessionId);
                } catch (error) {
                    log.error('Failed to remove specific session', { sessionId, error });
                }
            } else {
                const sessions = this.sessionManager.getSessions();
                log.debug('Removing all sessions', { sessionCount: sessions.length });

                if (sessions.length > 0) {
                    for (const session of sessions) {
                        try {
                            await removeSession(session.sessionId);
                        } catch (error) {
                            log.error('Failed to remove session', {
                                sessionId: session.sessionId,
                                error,
                            });
                        }
                    }
                }
            }
        } catch (error) {
            log.error('Failed to disconnect', { sessionId, error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.disconnect');
        }
    }

    async listSessions(): Promise<{ sessionId: string; dAppName: string; walletAddress: string }[]> {
        await this.ensureInitialized();

        const sessions = this.sessionManager.getSessionsForAPI();
        log.debug('Listing sessions', { sessionCount: sessions.length });

        return sessions;
    }

    // === Event Handler Registration (Delegated) ===

    onConnectRequest(cb: (event: EventConnectRequest) => void): void {
        log.debug('Registering connect request callback');

        if (this.eventRouter) {
            this.eventRouter.onConnectRequest(cb);
            log.debug('Connect request callback registered immediately');
        } else {
            log.debug('EventRouter not ready, queuing connect request callback');
            // Queue callback until initialized
            this.ensureInitialized().then(() => {
                this.eventRouter.onConnectRequest(cb);
                log.debug('Connect request callback registered after initialization');
            });
        }
    }

    onTransactionRequest(cb: (event: EventTransactionRequest) => void): void {
        log.debug('Registering transaction request callback');

        if (this.eventRouter) {
            this.eventRouter.onTransactionRequest(cb);
            log.debug('Transaction request callback registered immediately');
        } else {
            log.debug('EventRouter not ready, queuing transaction request callback');
            this.ensureInitialized().then(() => {
                this.eventRouter.onTransactionRequest(cb);
                log.debug('Transaction request callback registered after initialization');
            });
        }
    }

    onSignDataRequest(cb: (event: EventSignDataRequest) => void): void {
        log.debug('Registering sign data request callback');

        if (this.eventRouter) {
            this.eventRouter.onSignDataRequest(cb);
            log.debug('Sign data request callback registered immediately');
        } else {
            log.debug('EventRouter not ready, queuing sign data request callback');
            this.ensureInitialized().then(() => {
                this.eventRouter.onSignDataRequest(cb);
                log.debug('Sign data request callback registered after initialization');
            });
        }
    }

    onDisconnect(cb: (event: EventDisconnect) => void): void {
        log.debug('Registering disconnect callback');

        if (this.eventRouter) {
            this.eventRouter.onDisconnect(cb);
            log.debug('Disconnect callback registered immediately');
        } else {
            log.debug('EventRouter not ready, queuing disconnect callback');
            this.ensureInitialized().then(() => {
                this.eventRouter.onDisconnect(cb);
                log.debug('Disconnect callback registered after initialization');
            });
        }
    }

    removeConnectRequestCallback(cb: (event: EventConnectRequest) => void): void {
        log.debug('Removing connect request callback');
        this.eventRouter.removeConnectRequestCallback(cb);
    }

    removeTransactionRequestCallback(cb: (event: EventTransactionRequest) => void): void {
        log.debug('Removing transaction request callback');
        this.eventRouter.removeTransactionRequestCallback(cb);
    }

    removeSignDataRequestCallback(cb: (event: EventSignDataRequest) => void): void {
        log.debug('Removing sign data request callback');
        this.eventRouter.removeSignDataRequestCallback(cb);
    }

    removeDisconnectCallback(cb: (event: EventDisconnect) => void): void {
        log.debug('Removing disconnect callback');
        this.eventRouter.removeDisconnectCallback(cb);
    }

    // === URL Processing API ===

    /**
     * Handle pasted TON Connect URL/link
     * Parses the URL and creates a connect request event
     */
    async handleTonConnectUrl(url: string): Promise<void> {
        log.startTimer('TonWalletKit.handleTonConnectUrl');

        try {
            await this.ensureInitialized();

            log.debug('Handling TON Connect URL', { url });

            // Parse and validate the TON Connect URL
            const parsedUrl = this.parseTonConnectUrl(url);
            if (!parsedUrl) {
                throw new Error('Invalid TON Connect URL format');
            }

            log.debug('TON Connect URL parsed successfully', { parsedUrl });

            // Create a bridge event from the parsed URL
            const bridgeEvent = this.createConnectEventFromUrl(parsedUrl);
            if (!bridgeEvent) {
                throw new Error('Invalid TON Connect URL format');
            }

            log.debug('Bridge event created from URL', { bridgeEvent });

            await this.eventRouter.routeEvent(bridgeEvent);

            log.info('TON Connect URL handled successfully', { url });
        } catch (error) {
            log.error('Failed to handle TON Connect URL', { error, url });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.handleTonConnectUrl');
        }
    }

    /**
     * Parse TON Connect URL to extract connection parameters
     */
    private parseTonConnectUrl(url: string): {
        version: string;
        clientId: string;
        requestId: string;
        returnStrategy: string;
        r: string;
        [key: string]: string;
    } | null {
        try {
            log.debug('Parsing TON Connect URL', { url });

            let parsedUrl: URL;
            parsedUrl = new URL(url);

            // Extract query parameters
            const params: { [key: string]: string } = {};
            for (const [key, value] of parsedUrl.searchParams.entries()) {
                params[key] = value;
            }

            log.debug('URL parameters extracted', { params });

            // Validate required parameters
            if (!params.v || !params.id || !params.r) {
                log.warn('Missing required TON Connect URL parameters', {
                    hasVersion: !!params.v,
                    hasId: !!params.id,
                    hasR: !!params.r,
                });
                return null;
            }

            const result = {
                version: params.v,
                clientId: params.id,
                requestId: params.id,
                returnStrategy: params.ret || 'back',
                r: params.r,
                ...params,
            };

            log.debug('TON Connect URL parsed successfully', { result });
            return result;
        } catch (error) {
            log.error('Failed to parse TON Connect URL', { error, url });
            return null;
        }
    }

    /**
     * Create bridge event from parsed URL parameters
     */
    private createConnectEventFromUrl(params: {
        version: string;
        clientId: string;
        requestId: string;
        r: string;
        returnStrategy?: string;
    }): RawBridgeEventConnect | undefined {
        log.debug('Creating bridge event from URL parameters', { params });

        const rString = params.r;
        let r: ConnectRequest | undefined;

        try {
            r = rString ? (JSON.parse(rString) as ConnectRequest) : undefined;
            log.debug('Parsed r parameter', { r });
        } catch (error) {
            log.error('Failed to parse r parameter', { rString, error });
            return undefined;
        }

        if (!r?.manifestUrl || !params.clientId) {
            log.warn('Missing required parameters for bridge event', {
                hasManifestUrl: !!r?.manifestUrl,
                hasClientId: !!params.clientId,
            });
            return undefined;
        }

        const bridgeEvent: RawBridgeEventConnect = {
            id: params.requestId,
            method: 'startConnect',
            from: params.clientId,
            domain: '',
            params: {
                manifest: {
                    url: r.manifestUrl,
                },
                items: r.items,
                returnStrategy: params.returnStrategy,
            },
            timestamp: Date.now(),
        };

        log.debug('Bridge event created successfully', { bridgeEvent });
        return bridgeEvent;
    }

    // === Request Processing API (Delegated) ===

    async approveConnectRequest(event: EventConnectRequest): Promise<void> {
        log.startTimer('TonWalletKit.approveConnectRequest');

        try {
            await this.ensureInitialized();

            log.debug('Approving connect request', { event });
            await this.requestProcessor.approveConnectRequest(event);

            log.info('Connect request approved successfully', { eventId: event.id });
        } catch (error) {
            log.error('Failed to approve connect request', { event, error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.approveConnectRequest');
        }
    }

    async rejectConnectRequest(event: EventConnectRequest, reason?: string): Promise<void> {
        log.startTimer('TonWalletKit.rejectConnectRequest');

        try {
            await this.ensureInitialized();

            log.debug('Rejecting connect request', { event, reason });
            await this.requestProcessor.rejectConnectRequest(event, reason);

            log.info('Connect request rejected successfully', { eventId: event.id, reason });
        } catch (error) {
            log.error('Failed to reject connect request', { event, reason, error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.rejectConnectRequest');
        }
    }

    async approveTransactionRequest(event: EventTransactionRequest): Promise<{ signedBoc: string }> {
        log.startTimer('TonWalletKit.approveTransactionRequest');

        try {
            await this.ensureInitialized();

            log.debug('Approving transaction request', { event });
            const result = await this.requestProcessor.approveTransactionRequest(event);

            log.info('Transaction request approved successfully', {
                eventId: event.id,
                hasSignedBoc: !!result.signedBoc,
                signedBocLength: result.signedBoc.length,
            });

            return result;
        } catch (error) {
            log.error('Failed to approve transaction request', { event, error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.approveTransactionRequest');
        }
    }

    async rejectTransactionRequest(event: EventTransactionRequest, reason?: string): Promise<void> {
        log.startTimer('TonWalletKit.rejectTransactionRequest');

        try {
            await this.ensureInitialized();

            log.debug('Rejecting transaction request', { event, reason });
            await this.requestProcessor.rejectTransactionRequest(event, reason);

            log.info('Transaction request rejected successfully', { eventId: event.id, reason });
        } catch (error) {
            log.error('Failed to reject transaction request', { event, reason, error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.rejectTransactionRequest');
        }
    }

    async signDataRequest(event: EventSignDataRequest): Promise<{ signature: Uint8Array }> {
        log.startTimer('TonWalletKit.signDataRequest');

        try {
            await this.ensureInitialized();

            log.debug('Approving sign data request', { event });
            const result = await this.requestProcessor.approveSignDataRequest(event);

            log.info('Sign data request approved successfully', {
                eventId: event.id,
                hasSignature: !!result.signature,
                signatureLength: result.signature.length,
            });

            return result;
        } catch (error) {
            log.error('Failed to approve sign data request', { event, error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.signDataRequest');
        }
    }

    async rejectSignDataRequest(event: EventSignDataRequest, reason?: string): Promise<void> {
        log.startTimer('TonWalletKit.rejectSignDataRequest');

        try {
            await this.ensureInitialized();

            log.debug('Rejecting sign data request', { event, reason });
            await this.requestProcessor.rejectSignDataRequest(event, reason);

            log.info('Sign data request rejected successfully', { eventId: event.id, reason });
        } catch (error) {
            log.error('Failed to reject sign data request', { event, reason, error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.rejectSignDataRequest');
        }
    }

    // === TON Client Access ===

    /**
     * Get the shared TON client instance
     */
    getTonClient(): TonClient {
        if (!this.isInitialized) {
            log.error('Attempted to get TON client before initialization');
            throw new Error('TonWalletKit not yet initialized');
        }

        log.debug('Getting TON client instance');
        return this.tonClient;
    }

    // === Lifecycle Management ===

    /**
     * Check if kit is ready for use
     */
    isReady(): boolean {
        const ready = this.isInitialized;
        log.debug('Checking if kit is ready', { ready });
        return ready;
    }

    /**
     * Wait for initialization to complete
     */
    async waitForReady(): Promise<void> {
        log.debug('Waiting for kit to be ready');
        await this.ensureInitialized();
        log.debug('Kit is now ready');
    }

    /**
     * Get initialization status
     */
    getStatus(): { initialized: boolean; ready: boolean } {
        const status = {
            initialized: this.isInitialized,
            ready: this.isInitialized,
        };

        log.debug('Getting kit status', status);
        return status;
    }

    /**
     * Clean shutdown
     */
    async close(): Promise<void> {
        log.startTimer('TonWalletKit.close');

        try {
            log.info('Starting TonWalletKit shutdown');

            if (this.initializer) {
                await this.initializer.cleanup({
                    walletManager: this.walletManager,
                    sessionManager: this.sessionManager,
                    eventRouter: this.eventRouter,
                    requestProcessor: this.requestProcessor,
                    responseHandler: this.responseHandler,
                    tonClient: this.tonClient,
                    eventProcessor: this.eventProcessor,
                });

                log.debug('Initializer cleanup completed');
            }

            this.isInitialized = false;
            log.info('TonWalletKit shutdown completed successfully');
        } catch (error) {
            log.error('Error during TonWalletKit shutdown', { error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.close');
        }
    }

    // === Jettons API ===

    /**
     * Jettons API access
     */
    get jettons(): JettonsAPI {
        log.debug('Accessing jettons API');
        return this.jettonsManager;
    }

    /**
     * Get jettons manager for internal use
     */
    getJettonsManager(): JettonsManager {
        log.debug('Getting jettons manager instance');
        return this.jettonsManager;
    }

    /**
     * Get the event emitter for this kit instance
     * Allows external components to listen to and emit events
     */
    getEventEmitter(): EventEmitter {
        log.debug('Getting event emitter instance');
        return this.eventEmitter;
    }

    // === JS Bridge Support ===
    /**
     * Get the JS Bridge Manager instance for advanced use cases
     * @returns JSBridgeManager instance if available
     */
    getJSBridgeManager(): JSBridgeManager | undefined {
        const hasJSBridge = !!this.jsBridgeManager;
        log.debug('Getting JS Bridge Manager', { available: hasJSBridge });
        return this.jsBridgeManager;
    }

    /**
     * Process a bridge request from injected JS Bridge
     * This method is called by extension content scripts
     * @param request - The bridge request to process
     * @returns Promise resolving to the response data
     */
    async processBridgeRequest(request: BridgeRequest): Promise<unknown> {
        log.startTimer('TonWalletKit.processBridgeRequest');

        try {
            log.debug('Processing bridge request', { request });

            if (!this.jsBridgeManager || !this.jsBridgeManager.isAvailable()) {
                throw new Error('JS Bridge Manager is not available');
            }

            const result = await this.jsBridgeManager.processBridgeRequest(request);

            log.info('Bridge request processed successfully', {
                requestId: request.messageId,
                method: request.method,
                hasResult: !!result,
            });

            return result;
        } catch (error) {
            log.error('Failed to process bridge request', { request, error });
            throw error;
        } finally {
            log.endTimer('TonWalletKit.processBridgeRequest');
        }
    }
}
