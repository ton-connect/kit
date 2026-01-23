/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Minimal TonWalletKit - Pure orchestration layer

import { Address } from '@ton/core';
import type {
    CONNECT_EVENT_ERROR_CODES,
    ConnectEventSuccess,
    ConnectRequest,
    DisconnectEvent,
    SendTransactionRpcResponseError,
} from '@tonconnect/protocol';
import { CHAIN } from '@tonconnect/protocol';

import type { ITonWalletKit, TonWalletKitOptions, SessionInfo } from '../types';
import { Initializer, wrapWalletInterface } from './Initializer';
import type { InitializationResult } from './Initializer';
import { globalLogger } from './Logger';
import type { WalletManager } from './WalletManager';
import type { SessionManager } from './SessionManager';
import type { EventRouter } from './EventRouter';
import type { RequestProcessor } from './RequestProcessor';
import { JettonsManager } from './JettonsManager';
import type { JettonsAPI } from '../types/jettons';
import type {
    RawBridgeEventConnect,
    RawBridgeEventRestoreConnection,
    RawBridgeEventTransaction,
} from '../types/internal';
import { toConnectTransactionParamContent } from '../types/internal';
import { EventEmitter } from './EventEmitter';
import type { StorageEventProcessor } from './EventProcessor';
import type { BridgeManager } from './BridgeManager';
import type { BridgeEventMessageInfo, InjectedToExtensionBridgeRequestPayload } from '../types/jsBridge';
import type { ApiClient } from '../types/toncenter/ApiClient';
import { AnalyticsManager } from '../analytics';
import { getDeviceInfoForWallet } from '../utils/getDefaultWalletConfig';
import { WalletKitError, ERROR_CODES } from '../errors';
import { CallForSuccess } from '../utils/retry';
import { NetworkManager } from './NetworkManager';
import type { WalletId } from '../utils/walletId';
import type { Wallet, WalletAdapter } from '../api/interfaces';
import type {
    Network,
    TransactionRequest,
    TransactionRequestEvent,
    BridgeEvent,
    RequestErrorEvent,
    DisconnectionEvent,
    SignDataRequestEvent,
    ConnectionRequestEvent,
    TransactionApprovalResponse,
    SignDataApprovalResponse,
} from '../api/models';
import { asAddressFriendly } from '../utils';

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
    private networkManager: NetworkManager;
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
    private analyticsManager?: AnalyticsManager;

    constructor(options: TonWalletKitOptions) {
        this.config = options;

        if (options?.analytics?.enabled) {
            this.analyticsManager = new AnalyticsManager({
                ...options?.analytics,
                appInfo: {
                    appName: options?.deviceInfo?.appName,
                    appVersion: options?.deviceInfo?.appVersion,
                    ...options?.analytics?.appInfo,
                },
            });
        }

        // Initialize NetworkManager for multi-network support
        this.networkManager = new NetworkManager(options);

        this.eventEmitter = new EventEmitter();
        this.initializer = new Initializer(options, this.eventEmitter, this.analyticsManager);
        // Auto-initialize (lazy)
        this.initializationPromise = this.initialize();

        // Initialize JettonsManager with NetworkManager for multi-network support
        this.jettonsManager = new JettonsManager(10000, this.eventEmitter, this.networkManager);

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

            // Get the wallet to determine its network - use walletId if available, fall back to walletAddress
            const wallet = session.walletId ? this.walletManager?.getWallet(session.walletId) : undefined;
            if (!wallet) {
                log.error('Wallet not found for session', { walletId: session.walletId });
                return;
            }

            const walletAddress = wallet.getAddress();

            // Get device info with wallet-specific features if available
            const deviceInfo = getDeviceInfoForWallet(wallet, this.config.deviceInfo);

            // Create base response data
            const connectResponse: ConnectEventSuccess = {
                event: 'connect',
                id: Date.now(),
                payload: {
                    device: deviceInfo,
                    items: [
                        {
                            name: 'ton_addr',
                            address: Address.parse(walletAddress).toRawString(),
                            // TODO: Support multiple networks
                            network: wallet.getNetwork().chainId === CHAIN.MAINNET ? CHAIN.MAINNET : CHAIN.TESTNET,
                            walletStateInit: '',
                            publicKey: '',
                        },
                    ],
                },
            };

            this.bridgeManager.sendJsBridgeResponse(
                event?.tabId?.toString() || '',
                true,
                event?.id ?? event?.messageId,
                connectResponse,
            );
        });
    }

    // === Initialization ===

    /**
     * Initialize all components
     */
    private async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const components = await this.initializer.initialize(this.config, this.networkManager);
            this.assignComponents(components);
            await this.setupEventRouting();

            // Start the event processor recovery loop
            this.eventProcessor.startRecoveryLoop();

            // Start no-wallet event processing (for connect events)
            await this.eventProcessor.startProcessing();

            this.isInitialized = true;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            log.error('TonWalletKit initialization failed', { error: error?.toString() });
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
        this.eventProcessor = components.eventProcessor;
        this.bridgeManager = components.bridgeManager;
    }

    /**
     * Setup event routing from bridge to handlers
     */
    private async setupEventRouting(): Promise<void> {
        // The event routing logic will use the existing EventRouter
        // but integrate with our new ResponseHandler for error cases

        // Start event processing for existing wallets
        await this.startProcessingForExistingWallets();
    }

    /**
     * Start event processing for all existing wallets
     */
    private async startProcessingForExistingWallets(): Promise<void> {
        const wallets = this.walletManager.getWallets();

        for (const wallet of wallets) {
            try {
                const walletId = wallet.getWalletId();
                await this.eventProcessor.startProcessing(walletId);
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
    async ensureInitialized(): Promise<void> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
    }

    /**
     * Get all configured networks
     */
    getConfiguredNetworks(): Network[] {
        return this.networkManager.getConfiguredNetworks();
    }

    // === Wallet Management API (Delegated) ===

    getWallets(): Wallet[] {
        if (!this.isInitialized) {
            log.warn('TonWalletKit not yet initialized, returning empty array');
            return [];
        }
        return this.walletManager.getWallets();
    }

    /**
     * Get wallet by wallet ID (network:address format)
     */
    getWallet(walletId: WalletId): Wallet | undefined {
        if (!this.isInitialized) {
            log.warn('TonWalletKit not yet initialized, returning undefined');
            return undefined;
        }
        return this.walletManager.getWallet(walletId);
    }

    async addWallet(adapter: WalletAdapter): Promise<Wallet | undefined> {
        await this.ensureInitialized();

        // Get the wallet's network and verify we have a client for it
        const walletNetwork = adapter.getNetwork();
        if (!this.networkManager.hasNetwork(walletNetwork)) {
            throw new WalletKitError(
                ERROR_CODES.NETWORK_NOT_CONFIGURED,
                `No API client configured for wallet network ${walletNetwork}`,
                undefined,
                { walletNetwork, configuredNetworks: this.networkManager.getConfiguredNetworks() },
            );
        }

        const wallet = await wrapWalletInterface(adapter);
        const walletId = await this.walletManager.addWallet(wallet);

        // Start event processing for the wallet (whether new or existing)
        await this.eventProcessor.startProcessing(walletId);
        return wallet;
    }

    async removeWallet(walletIdOrAdapter: WalletId | WalletAdapter): Promise<void> {
        await this.ensureInitialized();

        let wallet: Wallet | undefined;
        let walletId: WalletId;
        if (typeof walletIdOrAdapter === 'string') {
            walletId = walletIdOrAdapter;
            wallet = this.walletManager.getWallet(walletIdOrAdapter);
        } else {
            walletId = this.walletManager.getWalletId(walletIdOrAdapter);
            wallet = this.walletManager.getWallet(walletId);
        }

        if (!wallet) {
            throw new WalletKitError(ERROR_CODES.WALLET_NOT_FOUND, 'Wallet not found for removal', undefined, {
                walletId,
            });
        }

        // Stop event processing for the wallet
        await this.eventProcessor.stopProcessing(wallet.getAddress());

        await this.walletManager.removeWallet(walletId);
        // Also remove associated sessions
        await this.sessionManager.removeSessionsForWallet(walletId);
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
            // Get session to check if it's a JS bridge session
            const session = await this.sessionManager.getSession(sessionId);

            if (session) {
                try {
                    // For HTTP bridge sessions, send as a response
                    await CallForSuccess(
                        () =>
                            this.bridgeManager.sendResponse(
                                {
                                    sessionId: sessionId,
                                    isJsBridge: session?.isJsBridge,
                                    id: Date.now(),
                                    from: sessionId,
                                } as unknown as BridgeEvent,
                                {
                                    event: 'disconnect',
                                    id: Date.now(),
                                    payload: {},
                                } as DisconnectEvent,
                                session,
                            ),
                        10,
                        100,
                    );
                } catch (error) {
                    log.error('Failed to send disconnect to bridge', { sessionId, error });
                }
            }

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

    onConnectRequest(cb: (event: ConnectionRequestEvent) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onConnectRequest(cb);
        } else {
            // Queue callback until initialized
            this.ensureInitialized().then(() => {
                this.eventRouter.onConnectRequest(cb);
            });
        }
    }

    onTransactionRequest(cb: (event: TransactionRequestEvent) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onTransactionRequest(cb);
        } else {
            this.ensureInitialized().then(() => {
                this.eventRouter.onTransactionRequest(cb);
            });
        }
    }

    onSignDataRequest(cb: (event: SignDataRequestEvent) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onSignDataRequest(cb);
        } else {
            this.ensureInitialized().then(() => {
                this.eventRouter.onSignDataRequest(cb);
            });
        }
    }

    onDisconnect(cb: (event: DisconnectionEvent) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onDisconnect(cb);
        } else {
            this.ensureInitialized().then(() => {
                this.eventRouter.onDisconnect(cb);
            });
        }
    }

    removeConnectRequestCallback(): void {
        this.eventRouter.removeConnectRequestCallback();
    }

    removeTransactionRequestCallback(): void {
        this.eventRouter.removeTransactionRequestCallback();
    }

    removeSignDataRequestCallback(): void {
        this.eventRouter.removeSignDataRequestCallback();
    }

    removeDisconnectCallback(): void {
        this.eventRouter.removeDisconnectCallback();
    }

    onRequestError(cb: (event: RequestErrorEvent) => void): void {
        if (this.eventRouter) {
            this.eventRouter.onRequestError(cb);
        } else {
            this.ensureInitialized().then(() => {
                this.eventRouter.onRequestError(cb);
            });
        }
    }

    removeErrorCallback(): void {
        this.eventRouter.removeErrorCallback();
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

    async handleNewTransaction(wallet: Wallet, data: TransactionRequest): Promise<void> {
        await this.ensureInitialized();

        data.validUntil ??= Math.floor(Date.now() / 1000) + 300;
        data.network ??= wallet.getNetwork();

        const walletId = wallet.getWalletId();
        const bridgeEvent: RawBridgeEventTransaction = {
            id: Date.now().toString(),
            method: 'sendTransaction',
            params: [JSON.stringify(toConnectTransactionParamContent(data))],
            from: '',
            domain: '',
            isLocal: true,
            walletId,
            walletAddress: asAddressFriendly(wallet.getAddress()),
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

    async approveConnectRequest(event: ConnectionRequestEvent): Promise<void> {
        await this.ensureInitialized();
        return this.requestProcessor.approveConnectRequest(event);
    }

    async rejectConnectRequest(
        event: ConnectionRequestEvent,
        reason?: string,
        errorCode?: CONNECT_EVENT_ERROR_CODES,
    ): Promise<void> {
        await this.ensureInitialized();
        return this.requestProcessor.rejectConnectRequest(event, reason, errorCode);
    }

    async approveTransactionRequest(event: TransactionRequestEvent): Promise<TransactionApprovalResponse> {
        await this.ensureInitialized();
        return this.requestProcessor.approveTransactionRequest(event);
    }

    async rejectTransactionRequest(
        event: TransactionRequestEvent,
        reason?: string | SendTransactionRpcResponseError['error'],
    ): Promise<void> {
        await this.ensureInitialized();
        return this.requestProcessor.rejectTransactionRequest(event, reason);
    }

    async approveSignDataRequest(event: SignDataRequestEvent): Promise<SignDataApprovalResponse> {
        await this.ensureInitialized();
        return this.requestProcessor.approveSignDataRequest(event);
    }

    async rejectSignDataRequest(event: SignDataRequestEvent, reason?: string): Promise<void> {
        await this.ensureInitialized();
        return this.requestProcessor.rejectSignDataRequest(event, reason);
    }

    // === TON Client Access ===

    /**
     * Get API client for a specific network
     * @param network - The network object
     * @returns The API client for the specified network
     * @throws WalletKitError if no client is configured for the network
     */
    getApiClient(network: Network): ApiClient {
        if (!this.isInitialized) {
            throw new WalletKitError(
                ERROR_CODES.INITIALIZATION_ERROR,
                'TonWalletKit not yet initialized - call initialize() first',
            );
        }
        return this.networkManager.getClient(network);
    }

    /**
     * Get the NetworkManager instance
     * Provides access to all configured network clients
     */
    getNetworkManager(): NetworkManager {
        return this.networkManager;
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
                bridgeManager: this.bridgeManager,
                sessionManager: this.sessionManager,
                eventRouter: this.eventRouter,
                requestProcessor: this.requestProcessor,
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
        await this.ensureInitialized();
        return this.bridgeManager.queueJsBridgeEvent(messageInfo, request);
    }
}
