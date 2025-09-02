// JS Bridge Manager - Parallel bridge system for TonConnect JS Bridge

import type { JSBridgeInjectOptions, BridgeRequest } from '../types/jsBridge';
import type { EventRouter } from '../core/EventRouter';
import type { SessionManager } from '../core/SessionManager';
import type { WalletManager } from '../core/WalletManager';
import { JSBridgeMessageHandler } from './JSBridgeMessageHandler';
// import { getInjectCode } from './JSBridgeInjector';
import { createReactNativeLogger } from '../core/Logger';

// Create React Native specific logger for better debugging
const log = createReactNativeLogger('JSBridgeManager');

/**
 * Configuration options for JS Bridge Manager
 */
export interface JSBridgeManagerOptions {
    /** Whether to enable JS Bridge functionality */
    enabled: boolean;
    /** Default wallet name for injection */
    defaultWalletName?: string;
    /** Default device info */
    deviceInfo?: Partial<JSBridgeInjectOptions['deviceInfo']>;
    /** Default wallet info */
    walletInfo?: JSBridgeInjectOptions['walletInfo'];
}

/**
 * Manages JS Bridge functionality as a parallel system to HTTP Bridge
 * Provides TonConnect JS Bridge support for embedded apps and extensions
 */
export class JSBridgeManager {
    private eventRouter: EventRouter;
    private sessionManager: SessionManager;
    private walletManager: WalletManager;
    private messageHandler: JSBridgeMessageHandler;
    private options: JSBridgeManagerOptions;
    private isEnabled: boolean = false;
    private startTime?: number;

    constructor(
        eventRouter: EventRouter,
        sessionManager: SessionManager,
        walletManager: WalletManager,
        options: JSBridgeManagerOptions = { enabled: true },
    ) {
        log.info('JSBridgeManager constructor called', {
            options: {
                enabled: options.enabled,
                defaultWalletName: options.defaultWalletName,
                hasDeviceInfo: !!options.deviceInfo,
                hasWalletInfo: !!options.walletInfo,
            },
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
        this.options = {
            defaultWalletName: 'tonwallet',
            ...options,
        };

        this.messageHandler = new JSBridgeMessageHandler(eventRouter, sessionManager, walletManager);
        this.isEnabled = this.options.enabled;

        log.debug('JSBridgeManager components initialized', {
            messageHandler: !!this.messageHandler,
            isEnabled: this.isEnabled,
        });

        if (this.isEnabled) {
            log.info('JS Bridge Manager initialized successfully', {
                defaultWalletName: this.options.defaultWalletName,
                timestamp: new Date().toISOString(),
            });
        } else {
            log.info('JS Bridge Manager initialized but disabled', {
                reason: 'enabled: false in options',
            });
        }
    }

    /**
     * Start the JS Bridge Manager
     */
    async start(): Promise<void> {
        this.startTime = performance.now();
        log.startTimer('JSBridgeManager.start');

        if (!this.isEnabled) {
            log.info('JS Bridge Manager is disabled, skipping start');
            return;
        }

        try {
            log.info('Starting JS Bridge Manager', {
                timestamp: new Date().toISOString(),
                options: this.options,
            });

            // JS Bridge doesn't need persistent connections like HTTP bridge
            // It works on-demand through message passing
            log.info('JS Bridge Manager started successfully', {
                startTime: this.startTime,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            log.critical(
                'Failed to start JS Bridge Manager',
                {
                    error,
                    startTime: this.startTime,
                    timestamp: new Date().toISOString(),
                    options: this.options,
                },
                error instanceof Error ? error : new Error(String(error)),
            );
            throw error;
        } finally {
            log.endTimer('JSBridgeManager.start');
        }
    }

    /**
     * Stop the JS Bridge Manager
     */
    async stop(): Promise<void> {
        log.startTimer('JSBridgeManager.stop');

        if (!this.isEnabled) {
            log.info('JS Bridge Manager is disabled, skipping stop');
            return;
        }

        try {
            log.info('Stopping JS Bridge Manager', {
                timestamp: new Date().toISOString(),
                uptime: this.startTime ? `${(performance.now() - this.startTime).toFixed(2)}ms` : 'unknown',
            });

            // Clean up any active connections
            // For now, this is a no-op since JS Bridge is stateless
            log.info('JS Bridge Manager stopped successfully');
        } catch (error) {
            log.error(
                'Error stopping JS Bridge Manager',
                {
                    error,
                    timestamp: new Date().toISOString(),
                },
                error instanceof Error ? error : new Error(String(error)),
            );
        } finally {
            log.endTimer('JSBridgeManager.stop');
        }
    }

    /**
     * Process a bridge request from injected JS Bridge
     * This method is called by extension content scripts or embedded apps
     * @param request - The bridge request to process
     * @returns Promise resolving to the response data
     */
    async processBridgeRequest(request: BridgeRequest): Promise<unknown> {
        log.startTimer('JSBridgeManager.processBridgeRequest');

        if (!this.isEnabled) {
            const error = new Error('JS Bridge Manager is disabled');
            log.error('Bridge request rejected - manager disabled', {
                request,
                error: error.message,
            });
            throw error;
        }

        log.debug('Processing bridge request', {
            method: request.method,
            messageId: request.messageId,
            source: request.source,
            timestamp: new Date().toISOString(),
        });

        try {
            const result = await this.messageHandler.handleBridgeRequest(request);

            log.info('Bridge request processed successfully', {
                method: request.method,
                messageId: request.messageId,
                hasResult: !!result,
                resultType: result ? typeof result : 'undefined',
                timestamp: new Date().toISOString(),
            });

            return result;
        } catch (error) {
            log.error(
                'Bridge request processing failed',
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
            log.endTimer('JSBridgeManager.processBridgeRequest');
        }
    }

    /**
     * Send an event to all connected JS bridges
     * @param event - The wallet event to send
     */
    sendEventToAllBridges(event: { event?: string; [key: string]: unknown }): void {
        if (!this.isEnabled) {
            log.debug('JS Bridge Manager is disabled, skipping event broadcast');
            return;
        }

        log.debug('Broadcasting event to JS bridges', {
            event: event.event,
            timestamp: new Date().toISOString(),
        });

        // In a real implementation, this would track all active bridge connections
        // and send events to each one. For now, we'll log it.
        log.info('Event broadcast completed', {
            event: event.event,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Check if JS Bridge is enabled and available
     */
    isAvailable(): boolean {
        const available = this.isEnabled;
        log.debug('Checking JS Bridge availability', {
            available,
            timestamp: new Date().toISOString(),
        });
        return available;
    }

    /**
     * Get current configuration
     */
    getConfiguration(): JSBridgeManagerOptions {
        const config = { ...this.options };
        log.debug('Getting JS Bridge Manager configuration', {
            config,
            timestamp: new Date().toISOString(),
        });
        return config;
    }

    /**
     * Update configuration
     * @param updates - Partial configuration updates
     */
    updateConfiguration(updates: Partial<JSBridgeManagerOptions>): void {
        const oldConfig = { ...this.options };
        this.options = { ...this.options, ...updates };
        this.isEnabled = this.options.enabled;

        log.info('JS Bridge Manager configuration updated', {
            old: oldConfig,
            new: this.options,
            changes: Object.keys(updates),
            enabled: this.isEnabled,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Get message handler for advanced use cases
     * @returns The message handler instance
     */
    getMessageHandler(): JSBridgeMessageHandler {
        log.debug('Getting message handler instance');
        return this.messageHandler;
    }

    /**
     * Get detailed status information
     */
    getStatus(): {
        enabled: boolean;
        isRunning: boolean;
        uptime: string;
        messageHandler: boolean;
        timestamp: string;
    } {
        const status = {
            enabled: this.isEnabled,
            isRunning: this.isEnabled && !!this.startTime,
            uptime: this.startTime ? `${(performance.now() - this.startTime).toFixed(2)}ms` : 'N/A',
            messageHandler: !!this.messageHandler,
            timestamp: new Date().toISOString(),
        };

        log.debug('Getting JS Bridge Manager status', status);
        return status;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): {
        startTime: number | undefined;
        currentTime: number;
        uptime: number | undefined;
        timestamp: string;
    } {
        const currentTime = performance.now();
        const uptime = this.startTime ? currentTime - this.startTime : undefined;

        const metrics = {
            startTime: this.startTime,
            currentTime,
            uptime,
            timestamp: new Date().toISOString(),
        };

        log.debug('Getting performance metrics', metrics);
        return metrics;
    }
}
