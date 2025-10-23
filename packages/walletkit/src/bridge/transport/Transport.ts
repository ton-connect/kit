import type { InjectedToExtensionBridgeRequestPayload } from '../../types/jsBridge';

/**
 * Response from transport layer
 */
export interface TransportResponse {
    success: boolean;
    payload?: unknown;
    error?: unknown;
}

/**
 * Abstract transport interface for bridge communication
 * Allows different implementations (extension, mock, etc.)
 */
export interface Transport {
    /**
     * Send a request and wait for response
     */
    send(request: Omit<InjectedToExtensionBridgeRequestPayload, 'id'>): Promise<unknown>;

    /**
     * Register callback for events from the wallet
     */
    onEvent(callback: (event: unknown) => void): void;

    /**
     * Check if this transport is available in current environment
     */
    isAvailable(): boolean;

    /**
     * Request content script injection
     */
    requestContentScriptInjection(): void;

    /**
     * Cleanup resources
     */
    destroy(): void;
}
