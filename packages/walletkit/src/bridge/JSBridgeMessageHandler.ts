// Message protocol handler for JS Bridge communication

import type { ConnectItem } from '@tonconnect/protocol';

import type {
    BridgeRequest,
    BridgeResponse,
    ConnectRequest,
    AppRequest,
    ConnectEvent,
    ConnectEventError,
    WalletResponse,
    WalletEvent,
} from '../types/jsBridge';
import type { EventRouter } from '../core/EventRouter';
import type { SessionManager } from '../core/SessionManager';
import type { WalletManager } from '../core/WalletManager';
import type { WalletInterface } from '../types/wallet';
import type { RawBridgeEventConnect, RawBridgeEventTransaction, RawBridgeEventSignData } from '../types/internal';
import { createReactNativeLogger } from '../core/Logger';

// Create React Native specific logger for better debugging
const log = createReactNativeLogger('JSBridgeMessageHandler');

/**
 * Handles message protocol between injected JS Bridge and extension/wallet
 */
export class JSBridgeMessageHandler {
    private eventRouter: EventRouter;
    private sessionManager: SessionManager;
    private walletManager: WalletManager;
    private activeConnections = new Map<string, { wallet?: WalletInterface; sessionId?: string }>();

    constructor(eventRouter: EventRouter, sessionManager: SessionManager, walletManager: WalletManager) {
        log.info('JSBridgeMessageHandler constructor called', {
            components: {
                hasEventRouter: !!eventRouter,
                hasSessionManager: !!sessionManager,
                hasWalletManager: !!walletManager,
            },
            timestamp: new Date().toISOString(),
        });

        this.eventRouter = eventRouter;
        this.sessionManager = sessionManager;
        this.walletManager = walletManager;

        log.debug('JSBridgeMessageHandler initialized successfully', {
            activeConnectionsCount: this.activeConnections.size,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Processes a bridge request from injected code
     * @param request - The bridge request
     * @returns Promise resolving to response data
     */
    async handleBridgeRequest(request: BridgeRequest): Promise<ConnectEvent | ConnectEventError | WalletResponse> {
        log.startTimer('JSBridgeMessageHandler.handleBridgeRequest');

        log.info('Handling bridge request', {
            method: request.method,
            messageId: request.messageId,
            source: request.source,
            timestamp: new Date().toISOString(),
        });

        try {
            let result: ConnectEvent | ConnectEventError | WalletResponse;

            switch (request.method) {
                case 'connect': {
                    log.debug('Processing connect request');
                    result = await this.handleConnectRequest(request);
                    break;
                }
                case 'restoreConnection': {
                    log.debug('Processing restore connection request');
                    result = await this.handleRestoreConnection(request);
                    break;
                }
                case 'send': {
                    log.debug('Processing send request');
                    result = await this.handleSendRequest(request);
                    break;
                }
                default: {
                    const error = new Error(`Unknown method: ${request.method}`);
                    log.error('Unknown bridge request method', {
                        method: request.method,
                        messageId: request.messageId,
                        source: request.source,
                    });
                    throw error;
                }
            }

            log.info('Bridge request handled successfully', {
                method: request.method,
                messageId: request.messageId,
                resultType: result ? typeof result : 'undefined',
                hasResult: !!result,
            });

            return result;
        } catch (error) {
            log.error(
                'Bridge request failed',
                {
                    method: request.method,
                    messageId: request.messageId,
                    source: request.source,
                    error,
                    timestamp: new Date().toISOString(),
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('JSBridgeMessageHandler.handleBridgeRequest');
        }
    }

    /**
     * Handles connect requests from dApps
     */
    private async handleConnectRequest(request: BridgeRequest): Promise<ConnectEvent> {
        log.startTimer('JSBridgeMessageHandler.handleConnectRequest');

        try {
            const { protocolVersion, message } = request.params;

            log.debug('Processing connect request', {
                protocolVersion,
                hasMessage: !!message,
                messageType: message ? typeof message : 'undefined',
                source: request.source,
            });

            if (!message || typeof message !== 'object') {
                throw new Error('Invalid connect request message');
            }

            const connectRequest = message as ConnectRequest;

            // Validate protocol version
            if (protocolVersion && protocolVersion > 2) {
                const error = new Error(`Unsupported protocol version: ${protocolVersion}`);
                log.error('Unsupported protocol version', {
                    protocolVersion,
                    supportedVersions: [1, 2],
                    source: request.source,
                });
                throw error;
            }

            log.debug('Protocol version validation passed', { protocolVersion });

            // For now, we'll simulate auto-approval with first available wallet
            const wallets = this.walletManager.getWallets();
            log.debug('Available wallets for connection', {
                walletCount: wallets.length,
                walletAddresses: wallets.map((w) => w.getAddress()),
            });

            if (wallets.length === 0) {
                const error = new Error('No wallets available');
                log.error('No wallets available for connection', {
                    source: request.source,
                    timestamp: new Date().toISOString(),
                });
                throw error;
            }

            const selectedWallet = wallets[0];
            const sessionId = this.generateSessionId();
            const domain = this.extractDAppName(connectRequest.manifestUrl);

            log.debug('Selected wallet for connection', {
                walletAddress: selectedWallet.getAddress(),
                sessionId,
                domain,
                source: request.source,
            });

            // Store connection info
            this.activeConnections.set(request.source, {
                sessionId: sessionId,
                wallet: selectedWallet,
            });

            log.debug('Connection stored in active connections', {
                source: request.source,
                sessionId,
                activeConnectionsCount: this.activeConnections.size,
            });

            // Create RawBridgeEvent for EventRouter
            const bridgeEvent: RawBridgeEventConnect = {
                id: request.messageId.toString(),
                method: 'startConnect',
                from: request.source,
                domain: domain,
                wallet: selectedWallet,
                params: {
                    manifest: {
                        url: connectRequest.manifestUrl,
                    },
                    items: connectRequest.items as ConnectItem[],
                },
            };

            log.debug('Bridge event created for EventRouter', {
                bridgeEvent,
                source: request.source,
            });

            try {
                // Route through EventRouter (this will trigger connect handlers)
                log.debug('Routing event through EventRouter');
                await this.eventRouter.routeEvent(bridgeEvent);
                log.debug('Event routed successfully through EventRouter');

                // Return TonConnect ConnectEvent format
                const connectItems = await this.buildConnectItemReplies(
                    connectRequest.items as ConnectItem[],
                    selectedWallet,
                );

                const result: ConnectEvent = {
                    event: 'connect',
                    id: request.messageId,
                    payload: {
                        items: connectItems,
                        device: {
                            platform: 'web',
                            appName: 'WalletKit',
                            appVersion: '1.0.0',
                            maxProtocolVersion: 2,
                            features: [
                                {
                                    name: 'SendTransaction' as const,
                                    maxMessages: 4,
                                },
                                {
                                    name: 'SignData' as const,
                                    types: ['text', 'binary', 'cell'],
                                },
                            ],
                        },
                    },
                };

                log.info('Connect request handled successfully', {
                    source: request.source,
                    sessionId,
                    walletAddress: selectedWallet.getAddress(),
                    connectItemsCount: connectItems.length,
                    result,
                });

                return result;
            } catch (error) {
                // Remove failed connection
                log.error('Failed to route event through EventRouter', {
                    source: request.source,
                    sessionId,
                    error,
                });

                this.activeConnections.delete(request.source);
                throw error;
            }
        } catch (error) {
            log.error(
                'Connect request handling failed',
                {
                    source: request.source,
                    error,
                    timestamp: new Date().toISOString(),
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('JSBridgeMessageHandler.handleConnectRequest');
        }
    }

    /**
     * Handles connection restoration requests
     */
    private async handleRestoreConnection(request: BridgeRequest): Promise<ConnectEvent | ConnectEventError> {
        log.startTimer('JSBridgeMessageHandler.handleRestoreConnection');

        try {
            log.debug('Processing restore connection request', {
                source: request.source,
                messageId: request.messageId,
            });

            const connectionInfo = this.activeConnections.get(request.source);

            if (!connectionInfo || !connectionInfo.wallet) {
                log.warn('Unknown app for connection restoration', {
                    source: request.source,
                    hasConnectionInfo: !!connectionInfo,
                    hasWallet: !!connectionInfo?.wallet,
                    activeConnectionsCount: this.activeConnections.size,
                });

                // Return ConnectEventError for unknown app
                const result: ConnectEventError = {
                    event: 'connect_error',
                    id: request.messageId,
                    payload: {
                        code: 100,
                        message: 'Unknown app',
                    },
                };

                log.debug('Returning connect error for unknown app', { result });
                return result;
            }

            log.debug('Found existing connection for restoration', {
                source: request.source,
                sessionId: connectionInfo.sessionId,
                walletAddress: connectionInfo.wallet.getAddress(),
            });

            // Return minimal ConnectEvent with just ton_addr
            const result: ConnectEvent = {
                event: 'connect',
                id: request.messageId,
                payload: {
                    items: [
                        {
                            name: 'ton_addr',
                            address: connectionInfo.wallet.getAddress(),
                            network: 'mainnet', // TODO: get from wallet or config
                            publicKey: Buffer.from(connectionInfo.wallet.publicKey).toString('hex'),
                            walletStateInit: await connectionInfo.wallet.getStateInit(),
                        },
                    ],
                    device: {
                        platform: 'web',
                        appName: 'WalletKit',
                        appVersion: '1.0.0',
                        maxProtocolVersion: 2,
                        features: [
                            {
                                name: 'SendTransaction',
                                maxMessages: 4,
                            },
                            {
                                name: 'SignData',
                                types: ['text', 'binary', 'cell'],
                            },
                        ],
                    },
                },
            };

            log.info('Connection restoration completed successfully', {
                source: request.source,
                sessionId: connectionInfo.sessionId,
                walletAddress: connectionInfo.wallet.getAddress(),
                result,
            });

            return result;
        } catch (error) {
            log.error(
                'Connection restoration failed',
                {
                    source: request.source,
                    error,
                    timestamp: new Date().toISOString(),
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('JSBridgeMessageHandler.handleRestoreConnection');
        }
    }

    /**
     * Handles send requests (transactions, sign data, etc.)
     */
    private async handleSendRequest(request: BridgeRequest): Promise<WalletResponse> {
        log.startTimer('JSBridgeMessageHandler.handleSendRequest');

        try {
            log.debug('Processing send request', {
                source: request.source,
                messageId: request.messageId,
            });

            const connectionInfo = this.activeConnections.get(request.source);

            if (!connectionInfo || !connectionInfo.wallet) {
                const error = new Error('Wallet not connected');
                log.error('Wallet not connected for send request', {
                    source: request.source,
                    hasConnectionInfo: !!connectionInfo,
                    hasWallet: !!connectionInfo?.wallet,
                    activeConnectionsCount: this.activeConnections.size,
                });
                throw error;
            }

            const { message } = request.params;
            if (!message || typeof message !== 'object') {
                throw new Error('Invalid send request message');
            }

            const appRequest = message as AppRequest;
            const domain = this.extractDAppName(''); // TODO: get proper domain

            log.debug('App request details', {
                method: appRequest.method,
                id: appRequest.id,
                domain,
                source: request.source,
                walletAddress: connectionInfo.wallet.getAddress(),
            });

            try {
                let result: unknown;

                switch (appRequest.method) {
                    case 'sendTransaction': {
                        log.debug('Handling send transaction request');
                        result = await this.handleSendTransaction(
                            appRequest,
                            connectionInfo.wallet,
                            request.source,
                            domain,
                        );
                        break;
                    }
                    case 'signData': {
                        log.debug('Handling sign data request');
                        result = await this.handleSignData(appRequest, connectionInfo.wallet, request.source, domain);
                        break;
                    }
                    default: {
                        const error = new Error(`Unsupported method: ${appRequest.method}`);
                        log.error('Unsupported app request method', {
                            method: appRequest.method,
                            source: request.source,
                        });
                        throw error;
                    }
                }

                const response: WalletResponse = {
                    result,
                    id: appRequest.id,
                };

                log.info('Send request handled successfully', {
                    method: appRequest.method,
                    source: request.source,
                    walletAddress: connectionInfo.wallet.getAddress(),
                    response,
                });

                return response;
            } catch (error) {
                log.error('App request handling failed', {
                    method: appRequest.method,
                    source: request.source,
                    error,
                });

                const errorResponse: WalletResponse = {
                    error: {
                        code: 1,
                        message: error instanceof Error ? error.message : 'Unknown error',
                    },
                    id: appRequest.id,
                };

                log.debug('Returning error response', { errorResponse });
                return errorResponse;
            }
        } catch (error) {
            log.error(
                'Send request handling failed',
                {
                    source: request.source,
                    error,
                    timestamp: new Date().toISOString(),
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('JSBridgeMessageHandler.handleSendRequest');
        }
    }

    /**
     * Handles transaction sending
     */
    private async handleSendTransaction(
        request: AppRequest,
        wallet: WalletInterface,
        source: string,
        domain: string,
    ): Promise<{ boc: string }> {
        log.startTimer('JSBridgeMessageHandler.handleSendTransaction');

        try {
            log.debug('Processing send transaction request', {
                requestId: request.id,
                source,
                domain,
                walletAddress: wallet.getAddress(),
            });

            // Ensure params is an array with at least one element
            if (!Array.isArray(request.params) || request.params.length === 0) {
                throw new Error('Invalid transaction parameters');
            }

            log.debug('Transaction parameters validated', {
                paramsCount: request.params.length,
                firstParam: request.params[0],
            });

            // Create and route RawBridgeEvent through EventRouter
            const bridgeEvent: RawBridgeEventTransaction = {
                id: request.id.toString(),
                method: 'sendTransaction',
                from: source,
                domain: domain,
                wallet: wallet,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                params: request.params[0] as unknown as any, // Transaction data from params - TODO: fix type
            };

            log.debug('Created bridge event for transaction', { bridgeEvent });

            await this.eventRouter.routeEvent(bridgeEvent);
            log.debug('Transaction event routed successfully through EventRouter');

            // For now, return a placeholder - in real implementation, this would come from the handler result
            // TODO: Implement proper response handling from EventRouter
            const result = { boc: '' };

            log.info('Send transaction request handled successfully', {
                requestId: request.id,
                source,
                walletAddress: wallet.getAddress(),
                result,
            });

            return result;
        } catch (error) {
            log.error(
                'Send transaction request failed',
                {
                    requestId: request.id,
                    source,
                    walletAddress: wallet.getAddress(),
                    error,
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('JSBridgeMessageHandler.handleSendTransaction');
        }
    }

    /**
     * Handles data signing
     */
    private async handleSignData(
        request: AppRequest,
        wallet: WalletInterface,
        source: string,
        domain: string,
    ): Promise<{ signature: number[]; timestamp: number }> {
        log.startTimer('JSBridgeMessageHandler.handleSignData');

        try {
            log.debug('Processing sign data request', {
                requestId: request.id,
                source,
                domain,
                walletAddress: wallet.getAddress(),
            });

            // Ensure params is an array with at least one element
            if (!Array.isArray(request.params) || request.params.length === 0) {
                throw new Error('Invalid sign data parameters');
            }

            log.debug('Sign data parameters validated', {
                paramsCount: request.params.length,
                firstParam: request.params[0],
            });

            // Create and route RawBridgeEvent through EventRouter
            const bridgeEvent: RawBridgeEventSignData = {
                id: request.id.toString(),
                method: 'signData',
                from: source,
                domain: domain,
                wallet: wallet,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                params: request.params[0] as unknown as any, // Data to sign from params - TODO: fix type
            };

            log.debug('Created bridge event for sign data', { bridgeEvent });

            await this.eventRouter.routeEvent(bridgeEvent);
            log.debug('Sign data event routed successfully through EventRouter');

            // For now, return a placeholder - in real implementation, this would come from the handler result
            // TODO: Implement proper response handling from EventRouter
            const result = {
                signature: [], // Convert Uint8Array to array for JSON
                timestamp: Date.now(),
            };

            log.info('Sign data request handled successfully', {
                requestId: request.id,
                source,
                walletAddress: wallet.getAddress(),
                result,
            });

            return result;
        } catch (error) {
            log.error(
                'Sign data request failed',
                {
                    requestId: request.id,
                    source,
                    walletAddress: wallet.getAddress(),
                    error,
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('JSBridgeMessageHandler.handleSignData');
        }
    }

    /**
     * Sends an event to the injected bridge
     */
    sendEventToBridge(source: string, event: WalletEvent): void {
        log.debug('Sending event to bridge', {
            source,
            event: event.event,
            timestamp: new Date().toISOString(),
        });

        // Create bridge event for sending to injected code
        // In extension context, this would use postMessage to content script
        // For now, we'll log it
        log.info('Event sent to bridge', {
            source,
            event: event.event,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Handles disconnection
     */
    async handleDisconnect(source: string): Promise<void> {
        log.startTimer('JSBridgeMessageHandler.handleDisconnect');

        try {
            log.debug('Processing disconnect request', { source });

            const connectionInfo = this.activeConnections.get(source);

            if (connectionInfo && connectionInfo.sessionId) {
                log.debug('Found connection info for disconnect', {
                    source,
                    sessionId: connectionInfo.sessionId,
                    walletAddress: connectionInfo.wallet?.getAddress(),
                });

                try {
                    // TODO: Implement session disconnect in SessionManager
                    // await this.sessionManager.disconnect(connectionInfo.sessionId);
                    log.debug('Session disconnect would be called here (TODO)');
                } catch (error) {
                    log.error('Failed to disconnect session', {
                        sessionId: connectionInfo.sessionId,
                        source,
                        error,
                    });
                }
            } else {
                log.debug('No connection info found for disconnect', { source });
            }

            this.activeConnections.delete(source);
            log.debug('Connection removed from active connections', {
                source,
                activeConnectionsCount: this.activeConnections.size,
            });

            // Send disconnect event
            this.sendEventToBridge(source, {
                event: 'disconnect',
                id: Date.now(),
                payload: {},
            });

            log.info('Disconnect handled successfully', { source });
        } catch (error) {
            log.error(
                'Disconnect handling failed',
                {
                    source,
                    error,
                    timestamp: new Date().toISOString(),
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('JSBridgeMessageHandler.handleDisconnect');
        }
    }

    /**
     * Utility methods
     */
    private extractDAppName(manifestUrl: string): string {
        try {
            const url = new URL(manifestUrl);
            const domain = url.hostname;
            log.debug('Extracted dApp domain from manifest URL', { manifestUrl, domain });
            return domain;
        } catch (error) {
            log.warn('Failed to extract dApp domain from manifest URL', { manifestUrl, error });
            return 'Unknown dApp';
        }
    }

    private generateSessionId(): string {
        const sessionId = `js-bridge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        log.debug('Generated new session ID', { sessionId });
        return sessionId;
    }

    private async buildConnectItemReplies(
        items: ConnectItem[],
        wallet: WalletInterface,
    ): Promise<
        Array<{
            name: string;
            address?: string;
            network?: string;
            publicKey?: string;
            walletStateInit?: string;
            proof?: {
                timestamp: number;
                domain: { lengthBytes: number; value: string };
                signature: string;
                payload: string;
            };
        }>
    > {
        log.debug('Building connect item replies', {
            itemsCount: items.length,
            itemNames: items.map((item) => item.name),
            walletAddress: wallet.getAddress(),
        });

        const replies = [];

        for (const item of items) {
            try {
                switch (item.name) {
                    case 'ton_addr': {
                        const tonAddrReply = {
                            name: 'ton_addr',
                            address: wallet.getAddress(),
                            network: 'mainnet', // TODO: get from wallet or config
                            publicKey: Buffer.from(wallet.publicKey).toString('hex'),
                            walletStateInit: await wallet.getStateInit(),
                        };
                        replies.push(tonAddrReply);

                        log.debug('Added ton_addr reply', {
                            address: tonAddrReply.address,
                            network: tonAddrReply.network,
                            hasPublicKey: !!tonAddrReply.publicKey,
                            hasStateInit: !!tonAddrReply.walletStateInit,
                        });
                        break;
                    }

                    case 'ton_proof': {
                        // TODO: Implement ton_proof generation
                        const tonProofReply = {
                            name: 'ton_proof',
                            proof: {
                                timestamp: Date.now(),
                                domain: {
                                    lengthBytes: 0,
                                    value: '',
                                },
                                signature: '',
                                payload: (item as { payload?: string }).payload || '',
                            },
                        };
                        replies.push(tonProofReply);

                        log.debug('Added ton_proof reply (placeholder)', {
                            timestamp: tonProofReply.proof.timestamp,
                            payload: tonProofReply.proof.payload,
                        });
                        break;
                    }

                    default: {
                        replies.push(item);
                        log.debug('Added default item reply', { itemName: (item as { name: string }).name });
                    }
                }
            } catch (error) {
                log.error('Failed to build reply for item', {
                    itemName: item.name,
                    item,
                    error,
                });
                // Continue with other items
            }
        }

        log.info('Connect item replies built successfully', {
            repliesCount: replies.length,
            replyNames: replies.map((reply) => reply.name),
        });

        return replies;
    }

    /**
     * Creates a response message for the bridge
     */
    createResponse(request: BridgeRequest, success: boolean, result?: unknown, error?: string): BridgeResponse {
        const response: BridgeResponse = {
            type: 'TONCONNECT_BRIDGE_RESPONSE',
            source: request.source,
            messageId: request.messageId,
            success,
            result,
            error,
        };

        log.debug('Created bridge response', { response });
        return response;
    }

    /**
     * Get detailed status information
     */
    getStatus(): {
        activeConnectionsCount: number;
        hasEventRouter: boolean;
        hasSessionManager: boolean;
        hasWalletManager: boolean;
        timestamp: string;
    } {
        const status = {
            activeConnectionsCount: this.activeConnections.size,
            hasEventRouter: !!this.eventRouter,
            hasSessionManager: !!this.sessionManager,
            hasWalletManager: !!this.walletManager,
            timestamp: new Date().toISOString(),
        };

        log.debug('Getting JSBridgeMessageHandler status', status);
        return status;
    }
}
