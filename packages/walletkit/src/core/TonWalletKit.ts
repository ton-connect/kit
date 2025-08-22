// Minimal TonWalletKit - Pure orchestration layer

import type { TonClient } from '@ton/ton';
import { ConnectRequest } from '@tonconnect/protocol';

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
import { globalLogger } from './Logger';
import type { WalletManager } from './WalletManager';
import type { SessionManager } from './SessionManager';
import type { EventRouter } from './EventRouter';
import type { RequestProcessor } from './RequestProcessor';
import type { ResponseHandler } from './ResponseHandler';
import { JettonsManager, type JettonInfo } from './JettonsManager';
import { RawBridgeEventConnect } from '../types/internal';

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
    private responseHandler!: ResponseHandler;
    private tonClient!: TonClient;
    private jettonsManager: JettonsManager;
    private initializer: Initializer;

    // State
    private isInitialized = false;
    private initializationPromise?: Promise<void>;

    constructor(options: TonWalletKitOptions) {
        this.initializer = new Initializer();
        this.jettonsManager = new JettonsManager();

        // Auto-initialize (lazy)
        this.initializationPromise = this.initialize(options);
    }

    // === Initialization ===

    /**
     * Initialize all components
     */
    private async initialize(options: TonWalletKitOptions): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Create emulation callback for jetton caching
            const emulationCallback = (emulationResult: unknown) => {
                if (emulationResult && typeof emulationResult === 'object' && 'metadata' in emulationResult) {
                    this.jettonsManager.addJettonsFromEmulationMetadata(
                        emulationResult.metadata as Record<
                            string,
                            {
                                is_indexed: boolean;
                                token_info?: unknown[];
                            }
                        >,
                    );
                }
            };

            const components = await this.initializer.initialize(options, emulationCallback);
            this.assignComponents(components);
            this.setupEventRouting();
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
        this.responseHandler = components.responseHandler;
        this.tonClient = components.tonClient;
    }

    /**
     * Setup event routing from bridge to handlers
     */
    private setupEventRouting(): void {
        // The event routing logic will use the existing EventRouter
        // but integrate with our new ResponseHandler for error cases
    }

    /**
     * Ensure initialization is complete
     */
    private async ensureInitialized(): Promise<void> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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

    async addWallet(walletConfig: WalletInitConfig): Promise<void> {
        await this.ensureInitialized();
        const wallet = await createWalletFromConfig(walletConfig, this.tonClient);
        await this.walletManager.addWallet(wallet);
    }

    async removeWallet(wallet: WalletInterface): Promise<void> {
        await this.ensureInitialized();
        await this.walletManager.removeWallet(wallet);
        // Also remove associated sessions
        await this.sessionManager.removeSessionsForWallet(wallet);
    }

    async clearWallets(): Promise<void> {
        await this.ensureInitialized();
        await this.walletManager.clearWallets();
        await this.sessionManager.clearSessions();
    }

    // === Session Management API (Delegated) ===

    async disconnect(sessionId?: string): Promise<void> {
        await this.ensureInitialized();

        if (sessionId) {
            await this.sessionManager.removeSession(sessionId);
        } else {
            await this.sessionManager.clearSessions();
        }
    }

    async listSessions(): Promise<{ sessionId: string; dAppName: string; walletAddress: string }[]> {
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
                throw new Error('Invalid TON Connect URL format');
            }

            // Create a bridge event from the parsed URL
            const bridgeEvent = this.createConnectEventFromUrl(parsedUrl);
            if (!bridgeEvent) {
                throw new Error('Invalid TON Connect URL format');
            }

            await this.eventRouter.routeEvent(bridgeEvent);
        } catch (error) {
            log.error('Failed to handle TON Connect URL', { error, url });
            throw error;
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
            method: 'startConnect',
            params: {
                manifest: {
                    url: r.manifestUrl,
                },
                items: r.items,
                returnStrategy: params.returnStrategy,
            },
            sessionId: params.clientId,
            timestamp: Date.now(),
        };
    }

    // === Request Processing API (Delegated) ===

    async approveConnectRequest(event: EventConnectRequest): Promise<void> {
        await this.ensureInitialized();
        await this.requestProcessor.approveConnectRequest(event);
    }

    async rejectConnectRequest(event: EventConnectRequest, reason?: string): Promise<void> {
        await this.ensureInitialized();
        await this.requestProcessor.rejectConnectRequest(event, reason);
    }

    async approveTransactionRequest(event: EventTransactionRequest): Promise<{ signedBoc: string }> {
        await this.ensureInitialized();
        return this.requestProcessor.approveTransactionRequest(event);
    }

    async rejectTransactionRequest(event: EventTransactionRequest, reason?: string): Promise<void> {
        await this.ensureInitialized();
        await this.requestProcessor.rejectTransactionRequest(event, reason);
    }

    async signDataRequest(event: EventSignDataRequest): Promise<{ signature: Uint8Array }> {
        await this.ensureInitialized();
        return this.requestProcessor.approveSignDataRequest(event);
    }

    async rejectSignDataRequest(event: EventSignDataRequest, reason?: string): Promise<void> {
        await this.ensureInitialized();
        await this.requestProcessor.rejectSignDataRequest(event, reason);
    }

    // === TON Client Access ===

    /**
     * Get the shared TON client instance
     */
    getTonClient(): TonClient {
        if (!this.isInitialized) {
            throw new Error('TonWalletKit not yet initialized');
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
                responseHandler: this.responseHandler,
                tonClient: this.tonClient,
            });
        }

        this.isInitialized = false;
    }

    // === Jettons API ===

    /**
     * Jettons API access
     */
    jettons = {
        getJettonInfo: (jettonAddress: string): JettonInfo | null => {
            return this.jettonsManager.getJettonInfo(jettonAddress);
        },
        getAddressJettons: (userAddress: string, offset = 0, limit = 50): Promise<JettonInfo[]> => {
            return this.jettonsManager.getAddressJettons(userAddress, offset, limit);
        },
    };

    /**
     * Get jettons manager for internal use
     */
    getJettonsManager(): JettonsManager {
        return this.jettonsManager;
    }
}
