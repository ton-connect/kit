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
    RawBridgeEvent,
} from '../types';
import { createWalletFromConfig, Initializer, type InitializationResult } from './Initializer';
import { logger } from './Logger';
import type { WalletManager } from './WalletManager';
import type { SessionManager } from './SessionManager';
import type { EventRouter } from './EventRouter';
import type { RequestProcessor } from './RequestProcessor';
import type { ResponseHandler } from './ResponseHandler';
import { RawBridgeEventConnect } from '../types/internal';

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
    private initializer: Initializer;

    // State
    private isInitialized = false;
    private initializationPromise?: Promise<void>;

    constructor(options: TonWalletKitOptions) {
        this.initializer = new Initializer();

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
            const components = await this.initializer.initialize(options);
            this.assignComponents(components);
            this.setupEventRouting();
            this.isInitialized = true;
        } catch (error) {
            logger.error('TonWalletKit initialization failed', { error });
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
            logger.warn('TonWalletKit not yet initialized, returning empty array');
            return [];
        }
        return this.walletManager.getWallets();
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

    async listSessions(): Promise<{ sessionId: string; dAppName: string; wallet: WalletInterface }[]> {
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

            // Route the event through the normal event system
            const wallet = this.walletManager.getWallets()[0]; // Use first available wallet
            await this.eventRouter.routeEvent(bridgeEvent, wallet);
        } catch (error) {
            logger.error('Failed to handle TON Connect URL', { error, url });
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
                logger.warn('Missing required TON Connect URL parameters');
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
            logger.error('Failed to parse TON Connect URL', { error, url });
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
        // clientId =
        // '39166d5445bcaca9499de367e4b113477e15347a7fbef0977494b4555e3dac65'
        // id =
        // '39166d5445bcaca9499de367e4b113477e15347a7fbef0977494b4555e3dac65'
        // r =
        // '{"manifestUrl":"https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json","items":[{"name":"ton_addr"},{"name":"ton_proof","payload":"80f1696bddc5e46a4136cb523483da58a0b4d525d781ecc5df55820930b4dbc2"}]}'
        // requestId =
        // '39166d5445bcaca9499de367e4b113477e15347a7fbef0977494b4555e3dac65'
        // ret =
        // 'none'
        // returnStrategy =
        // 'none'
        // v =
        // '2'
        // version =
        // '2'

        // const clientId = parsed.searchParams.get('id') || ''; // '230f1e4df32364888a5dbd92a410266fcb974b73e30ff3e546a654fc8ee2c953'
        const rString = params.r;
        const r = rString ? (JSON.parse(rString) as ConnectRequest) : undefined;

        if (!r?.manifestUrl || !params.clientId) {
            return undefined;
        }
        return {
            id: params.requestId,
            method: 'start_connect',
            params: {
                manifest: {
                    url: r.manifestUrl,
                },
                items: [{ name: 'ton_addr' }, { name: 'ton_proof', payload: params.requestId }],
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
}
