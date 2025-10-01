// Minimal TonWalletKit - Pure orchestration layer

import { Address } from '@ton/core';
import {
    CHAIN,
    ConnectEventSuccess,
    ConnectRequest,
    DisconnectEvent,
    SendTransactionRpcResponseError,
} from '@tonconnect/protocol';

import type {
    ITonWalletKit,
    TonWalletKitOptions,
    WalletInterface,
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventDisconnect,
    WalletInitConfig,
    SessionInfo,
} from '../types';
import { createWalletFromConfig, Initializer, type InitializationResult } from './Initializer';
import { globalLogger } from './Logger';
import type { WalletManager } from './WalletManager';
import type { SessionManager } from './SessionManager';
import type { EventRouter } from './EventRouter';
import type { RequestProcessor } from './RequestProcessor';
// import type { ResponseHandler } from './ResponseHandler';
import { JettonsManager } from './JettonsManager';
import type { JettonsAPI } from '../types/jettons';
import {
    BridgeEventBase,
    ConnectTransactionParamContent,
    RawBridgeEventConnect,
    RawBridgeEventRestoreConnection,
    RawBridgeEventTransaction,
    SendRequestResult,
} from '../types/internal';
import { EventEmitter } from './EventEmitter';
import { StorageEventProcessor } from './EventProcessor';
import { BridgeManager } from './BridgeManager';
import type { BridgeEventMessageInfo, InjectedToExtensionBridgeRequestPayload } from '../types/jsBridge';
import { WalletInitInterface } from '../types/wallet';
import { ApiClient } from '../types/toncenter/ApiClient';
import { getDeviceInfoWithDefaults } from '../utils/getDefaultWalletConfig';
import { Hash } from '../types/primitive';
import { EventRequestError } from '../types/events';
import { AnalyticsApi } from '../analytics/sender';
import { WalletKitError, ERROR_CODES } from '../errors';

const log = globalLogger.createChild('TonWalletKit');

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
    // private responseHandler!: ResponseHandler;
    private tonClient!: ApiClient;
    private jettonsManager!: JettonsManager;
    private initializer: Initializer;
    private eventProcessor!: StorageEventProcessor;
    private bridgeManager!: BridgeManager;

    private config: TonWalletKitOptions;

    // Event emitter for this kit instance
    private eventEmitter: EventEmitter;

    // State
    private isInitialized = false;
    private initializationPromise?: Promise<void>;
    private analyticsApi?: AnalyticsApi;

    constructor(options: TonWalletKitOptions) {
        this.config = options;

        if (options?.analytics?.enabled) {
            this.analyticsApi = new AnalyticsApi(options?.analytics);
        }

        this.eventEmitter = new EventEmitter();
        this.initializer = new Initializer(options, this.eventEmitter, this.analyticsApi);
        // Auto-initialize (lazy)
        this.initializationPromise = this.initialize();

        this.eventEmitter.on('restoreConnection', async (event: RawBridgeEventRestoreConnection) => {
            if (!event.domain) {
                log.error('Domain is required for restore connection');
                return;
            }
            const session = await this.sessionManager.getSessionByDomain(event.domain);
            if (!session) {
                log.error('Session not found for domain', { domain: event.domain });
                return;
            }
            // Create base response data
            const connectResponse: ConnectEventSuccess = {
                event: 'connect',
                id: Date.now(),
                payload: {
                    device: getDeviceInfoWithDefaults(this.config.deviceInfo),
                    items: [
                        {
                            name: 'ton_addr',
                            address: Address.parse(session.walletAddress).toRawString(),
                            network: this.getNetwork(),
                            walletStateInit: '',
                            publicKey: '',
                        },
                    ],
                },
            };

            this.bridgeManager.sendJsBridgeResponse(event?.tabId?.toString() || '', true, event?.id, connectResponse);
        });
    }

    // === Initialization ===

    /**
     * Initialize all components
     */
    private async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const components = await this.initializer.initialize(this.config);
            this.assignComponents(components);
            this.setupEventRouting();

            this.jettonsManager = new JettonsManager(10000, this.eventEmitter, this.tonClient);

            // Start the event processor recovery loop
            this.eventProcessor.startRecoveryLoop();

            // Start no-wallet event processing (for connect events)
            await this.eventProcessor.startNoWalletProcessing();

            this.isInitialized = true;
        } catch (error) {
            log.error('TonWalletKit initialization failed', { error });
            throw error;
        }
    }

    /**
     * Assign initialized components
     */
    private assignComponents(components: InitializationResult): void {
        this.walletManager = components.walletManager;
        this.sessionManager = components.sessionManager;
        this.eventRouter = components.eventRouter;
        this.requestProcessor = components.requestProcessor;
        // this.responseHandler = components.responseHandler;
        this.tonClient = components.tonClient;
        this.eventProcessor = components.eventProcessor;
        this.bridgeManager = components.bridgeManager;
    }

    /**
     * Setup event routing from bridge to handlers
     */
    private setupEventRouting(): void {
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

        for (const wallet of wallets) {
            try {
                await this.eventProcessor.startProcessing(wallet.getAddress());
            } catch (error) {
                log.error('Failed to start event processing for wallet', {
                    walletAddress: wallet.getAddress(),
                    error,
                });
            }
        }
    }

    /**
     * Ensure initialization is complete
     */
    private async ensureInitialized(): Promise<void> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
    }

    getNetwork(): CHAIN {
        return this.config.network ?? CHAIN.TESTNET;
    }

    // === Wallet Management API (Delegated) ===

    getWallets(): WalletInterface[] {
        if (!this.isInitialized) {
            log.warn('TonWalletKit not yet initialized, returning empty array');
            return [];
        }
        return this.walletManager.getWallets();
    }

    /**
     * Get wallet by address
     */
    getWallet(address: string): WalletInterface | undefined {
        if (!this.isInitialized) {
            log.warn('TonWalletKit not yet initialized, returning undefined');
            return undefined;
        }
        return this.walletManager.getWallet(address);
    }

    async addWallet(walletConfig: WalletInitConfig): Promise<WalletInterface | undefined> {
        await this.ensureInitialized();
        const wallet = await createWalletFromConfig(walletConfig, this.tonClient);
        const walletAdded = await this.walletManager.addWallet(wallet);

        // wallet already exists
        if (!walletAdded) {
            return undefined;
        }

        // Start event processing for the new wallet
        await this.eventProcessor.startProcessing(wallet.getAddress());
        return wallet;
    }

    async removeWallet(argWallet: WalletInitInterface | string): Promise<void> {
        await this.ensureInitialized();

        const wallet = typeof argWallet === 'string' ? this.walletManager.getWallet(argWallet) : argWallet;
        if (!wallet) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_NOT_FOUND,
                'Wallet not found for sending transaction',
                undefined,
                { walletAddress: typeof argWallet === 'string' ? argWallet : 'Unknown' },
            );
        }

        // Stop event processing for the wallet
        await this.eventProcessor.stopProcessing(wallet.getAddress());

        await this.walletManager.removeWallet(wallet);
        // Also remove associated sessions
        await this.sessionManager.removeSessionsForWallet(wallet);
    }

    async clearWallets(): Promise<void> {
        await this.ensureInitialized();

        // Stop event processing for all wallets
        const wallets = this.walletManager.getWallets();
        for (const wallet of wallets) {
            await this.eventProcessor.stopProcessing(wallet.getAddress());
        }

        await this.walletManager.clearWallets();
        await this.sessionManager.clearSessions();
    }

    // === Session Management API (Delegated) ===

    async disconnect(sessionId?: string): Promise<void> {
        await this.ensureInitialized();

        const removeSession = async (sessionId: string) => {
            // TODO FIX REMOVE SESSION
            await this.bridgeManager.sendResponse(
                {
                    sessionId: sessionId,
                    isJsBridge: false,
                    id: Date.now(),
                } as unknown as BridgeEventBase,
                {
                    event: 'disconnect',
                    id: Date.now(),
                    payload: {},
                } as DisconnectEvent,
            );
            // await this.bridgeManager.sendResponse(sessionId, false, null, {
            //     event: 'disconnect',
            //     id: Date.now(),
            //     payload: {},
            // } as DisconnectEvent);
            await this.sessionManager.removeSession(sessionId);
        };
        if (sessionId) {
            try {
                await removeSession(sessionId);
            } catch (error) {
                log.error('Failed to remove session', { sessionId, error });
            }
        } else {
            const sessions = this.sessionManager.getSessions();
            if (sessions.length > 0) {
                for (const session of sessions) {
                    try {
                        await removeSession(session.sessionId);
                    } catch (error) {
                        log.error('Failed to remove session', { sessionId: session.sessionId, error });
                    }
                }
            }
        }
    }

    async listSessions(): Promise<SessionInfo[]> {
        await this.ensureInitialized();
        return this.sessionManager.getSessionsForAPI();
    }

    // === Event Handler Registration (Delegated) ===

    onConnectRequest(cb: (event: EventConnectRequest) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onConnectRequest(cb);
        } else {
            // Queue callback until initialized
            this.ensureInitialized().then(() => {
                this.eventRouter.onConnectRequest(cb);
            });
        }
    }

    onTransactionRequest(cb: (event: EventTransactionRequest) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onTransactionRequest(cb);
        } else {
            this.ensureInitialized().then(() => {
                this.eventRouter.onTransactionRequest(cb);
            });
        }
    }

    onSignDataRequest(cb: (event: EventSignDataRequest) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onSignDataRequest(cb);
        } else {
            this.ensureInitialized().then(() => {
                this.eventRouter.onSignDataRequest(cb);
            });
        }
    }

    onDisconnect(cb: (event: EventDisconnect) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onDisconnect(cb);
        } else {
            this.ensureInitialized().then(() => {
                this.eventRouter.onDisconnect(cb);
            });
        }
    }

    removeConnectRequestCallback(cb: (event: EventConnectRequest) => void): void {
        this.eventRouter.removeConnectRequestCallback(cb);
    }

    removeTransactionRequestCallback(cb: (event: EventTransactionRequest) => void): void {
        this.eventRouter.removeTransactionRequestCallback(cb);
    }

    removeSignDataRequestCallback(cb: (event: EventSignDataRequest) => void): void {
        this.eventRouter.removeSignDataRequestCallback(cb);
    }

    removeDisconnectCallback(cb: (event: EventDisconnect) => void): void {
        this.eventRouter.removeDisconnectCallback(cb);
    }

    onRequestError(cb: (event: EventRequestError) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onRequestError(cb);
        } else {
            this.ensureInitialized().then(() => {
                this.eventRouter.onRequestError(cb);
            });
        }
    }

    removeErrorCallback(cb: (event: EventRequestError) => void): void {
        this.eventRouter.removeErrorCallback(cb);
    }

    // === URL Processing API ===

    /**
     * Handle pasted TON Connect URL/link
     * Parses the URL and creates a connect request event
     */
    async handleTonConnectUrl(url: string): Promise<void> {
        await this.ensureInitialized();

        try {
            // Parse and validate the TON Connect URL
            const parsedUrl = this.parseTonConnectUrl(url);
            if (!parsedUrl) {
                throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid TON Connect URL format', undefined, {
                    url,
                });
            }

            // Create a bridge event from the parsed URL
            const bridgeEvent = this.createConnectEventFromUrl(parsedUrl);
            if (!bridgeEvent) {
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Invalid TON Connect URL - unable to create bridge event',
                    undefined,
                    { parsedUrl },
                );
            }

            await this.eventRouter.routeEvent(bridgeEvent);
        } catch (error) {
            log.error('Failed to handle TON Connect URL', { error, url });
            throw error;
        }
    }

    async handleNewTransaction(wallet: WalletInterface, data: ConnectTransactionParamContent): Promise<void> {
        await this.ensureInitialized();

        data.valid_until ??= Math.floor(Date.now() / 1000) + 300;
        data.network ??= this.config.network ?? CHAIN.TESTNET;

        const bridgeEvent: RawBridgeEventTransaction = {
            id: Date.now().toString(),
            method: 'sendTransaction',
            params: [JSON.stringify(data)],
            from: '',
            domain: '',
            isLocal: true,
            walletAddress: wallet.getAddress().toString(),
        };
        await this.eventRouter.routeEvent(bridgeEvent);
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
            let parsedUrl: URL;

            parsedUrl = new URL(url);

            // Extract query parameters
            const params: { [key: string]: string } = {};
            for (const [key, value] of parsedUrl.searchParams.entries()) {
                params[key] = value;
            }

            // Validate required parameters
            if (!params.v || !params.id || !params.r) {
                log.warn('Missing required TON Connect URL parameters');
                return null;
            }

            return {
                version: params.v,
                clientId: params.id,
                requestId: params.id,
                returnStrategy: params.ret || 'back',
                r: params.r,
                ...params,
            };
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
        const rString = params.r;
        const r = rString ? (JSON.parse(rString) as ConnectRequest) : undefined;

        if (!r?.manifestUrl || !params.clientId) {
            return undefined;
        }
        return {
            from: params.clientId,
            id: params.requestId,
            method: 'connect',
            params: {
                manifest: {
                    url: r.manifestUrl,
                },
                items: r.items,
                returnStrategy: params.returnStrategy,
            },
            timestamp: Date.now(),
            domain: '',
        };
    }

    // === Request Processing API (Delegated) ===

    async approveConnectRequest(event: EventConnectRequest): Promise<SendRequestResult> {
        await this.ensureInitialized();
        return this.requestProcessor.approveConnectRequest(event);
    }

    async rejectConnectRequest(event: EventConnectRequest, reason?: string): Promise<SendRequestResult> {
        await this.ensureInitialized();
        return this.requestProcessor.rejectConnectRequest(event, reason);
    }

    async approveTransactionRequest(event: EventTransactionRequest): Promise<SendRequestResult<{ signedBoc: string }>> {
        await this.ensureInitialized();
        return this.requestProcessor.approveTransactionRequest(event);
    }

    async rejectTransactionRequest(
        event: EventTransactionRequest,
        reason?: string | SendTransactionRpcResponseError['error'],
    ): Promise<SendRequestResult> {
        await this.ensureInitialized();
        return this.requestProcessor.rejectTransactionRequest(event, reason);
    }

    async signDataRequest(event: EventSignDataRequest): Promise<SendRequestResult<{ signature: Hash }>> {
        await this.ensureInitialized();
        return this.requestProcessor.approveSignDataRequest(event);
    }

    async rejectSignDataRequest(event: EventSignDataRequest, reason?: string): Promise<SendRequestResult> {
        await this.ensureInitialized();
        return this.requestProcessor.rejectSignDataRequest(event, reason);
    }

    // === TON Client Access ===

    /**
     * Get the shared TON client instance
     */
    getApiClient(): ApiClient {
        if (!this.isInitialized) {
            throw new WalletKitError(
                ERROR_CODES.INITIALIZATION_ERROR,
                'TonWalletKit not yet initialized - call initialize() first',
            );
        }
        return this.tonClient;
    }

    // === Lifecycle Management ===

    /**
     * Check if kit is ready for use
     */
    isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Wait for initialization to complete
     */
    async waitForReady(): Promise<void> {
        await this.ensureInitialized();
    }

    /**
     * Get initialization status
     */
    getStatus(): { initialized: boolean; ready: boolean } {
        return {
            initialized: this.isInitialized,
            ready: this.isInitialized,
        };
    }

    /**
     * Clean shutdown
     */
    async close(): Promise<void> {
        if (this.initializer) {
            await this.initializer.cleanup({
                walletManager: this.walletManager,
                sessionManager: this.sessionManager,
                eventRouter: this.eventRouter,
                requestProcessor: this.requestProcessor,
                // responseHandler: this.responseHandler,
                tonClient: this.tonClient,
                eventProcessor: this.eventProcessor,
            });
        }

        this.isInitialized = false;
    }

    // === Jettons API ===

    /**
     * Jettons API access
     */
    get jettons(): JettonsAPI {
        return this.jettonsManager;
    }

    /**
     * Get jettons manager for internal use
     */
    getJettonsManager(): JettonsManager {
        return this.jettonsManager;
    }

    /**
     * Get the event emitter for this kit instance
     * Allows external components to listen to and emit events
     */
    getEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }

    /**
     * Process a bridge request from injected JS Bridge
     * This method is called by extension content scripts
     * @param request - The bridge request to process
     * @returns Promise resolving to the response data
     */
    async processInjectedBridgeRequest(
        messageInfo: BridgeEventMessageInfo,
        request: InjectedToExtensionBridgeRequestPayload,
    ): Promise<unknown> {
        return this.bridgeManager.queueJsBridgeEvent(messageInfo, request);
    }
}
