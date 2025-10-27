/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Types for TonConnect JS Bridge implementation
import { type DeviceInfo, type Feature } from '@tonconnect/protocol';
import { type WalletInfo } from '@tonconnect/sdk';

export { type Feature, type DeviceInfo, type WalletInfo };

export interface ConnectRequest {
    manifestUrl: string;
    items: ConnectItem[];
}

export interface ConnectItem {
    name: string;
    [key: string]: unknown;
}

export interface ConnectEvent {
    event: 'connect';
    id: number;
    payload: {
        items: ConnectItemReply[];
        device: DeviceInfo;
    };
}

export interface ConnectEventError {
    event: 'connect_error';
    id: number;
    payload: {
        code: number;
        message: string;
    };
}

export interface ConnectItemReply {
    name: string;
    [key: string]: unknown;
}

export interface DisconnectEvent {
    event: 'disconnect';
    id: number;
    payload: Record<string, never>;
}

export interface AppRequest {
    method: string;
    params: unknown[];
    id: string;
}

export interface WalletResponse {
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
    id: string;
}

export type WalletEvent = DisconnectEvent;

/**
 * TonConnect JS Bridge interface as specified in the TON Connect documentation
 * @see https://github.com/ton-blockchain/ton-connect/blob/main/bridge.md#js-bridge
 */
export interface TonConnectBridge {
    deviceInfo: DeviceInfo;
    walletInfo?: WalletInfo;
    protocolVersion: number;
    isWalletBrowser: boolean;

    connect(protocolVersion: number, message: ConnectRequest): Promise<ConnectEvent>;
    restoreConnection(): Promise<ConnectEvent | ConnectEventError>;
    send(message: AppRequest): Promise<WalletResponse>;
    listen(callback: (event: WalletEvent) => void): () => void;
}

/**
 * Options for JS Bridge injection
 */
export interface JSBridgeInjectOptions {
    deviceInfo?: Partial<DeviceInfo>;
    walletInfo?: WalletInfo;
    jsBridgeKey?: string;
    injectTonKey?: boolean;
    isWalletBrowser?: boolean;
}

/**
 * Internal message types for communication between injected bridge and extension
 */
export interface InjectedToExtensionBridgeRequest {
    type: 'TONCONNECT_BRIDGE_REQUEST';
    messageId: string;
    payload: InjectedToExtensionBridgeRequestPayload;
    source: string;
}

export interface InjectedToExtensionBridgeRequestPayload {
    id: string;
    method: string;
    params: Array<unknown> | Record<string, unknown>;
    from?: string;
    traceId?: string;
}

export interface BridgeResponse {
    type: 'TONCONNECT_BRIDGE_RESPONSE';
    source: string;
    messageId: number;
    success: boolean;
    result?: unknown;
    error?: string | { code: number; message: string };
}

export interface BridgeEvent {
    type: 'TONCONNECT_BRIDGE_EVENT';
    source: string;
    event: WalletEvent;
}

export interface BridgeEventMessageInfo {
    messageId: string;
    tabId?: string;
    domain?: string;
}

/**
 * Custom transport function for JS Bridge responses
 * Allows custom implementation of message delivery to injected bridge
 *
 * @param sessionId - Session/tab identifier
 * @param message - Bridge response message to send
 *
 * @example
 * ```typescript
 * const customTransport: JSBridgeTransportFunction = async (sessionId, message) => {
 *   // Custom implementation, e.g., WebSocket, postMessage, etc.
 *   await myCustomChannel.send(sessionId, message);
 * };
 * ```
 */
export type JSBridgeTransportFunction = (sessionId: string, message: unknown) => Promise<void> | void;
