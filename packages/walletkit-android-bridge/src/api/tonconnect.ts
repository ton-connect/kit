/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * tonconnect.ts – TonConnect operations
 *
 * Simplified bridge for TonConnect URL handling, session management, and internal browser requests.
 * Session transformation handled by Kotlin SessionResponseParser.
 */

import type {
    BridgeEventMessageInfo,
    ConnectEvent,
    ConnectEventError,
    InjectedToExtensionBridgeRequestPayload,
    WalletResponse,
    DisconnectEvent,
} from '@ton/walletkit';
import type { JsBridgeTransportMessage } from '../types/bridge';
import type { HandleTonConnectUrlArgs, DisconnectSessionArgs, ProcessInternalBrowserRequestArgs } from '../types';
import { callBridge } from '../utils/bridgeWrapper';
import { ensureInternalBrowserResolverMap } from '../utils/internalBrowserResolvers';

/**
 * TonConnect event payload types that can be returned from processInternalBrowserRequest.
 */
export type TonConnectEventPayload = ConnectEvent | ConnectEventError | WalletResponse | DisconnectEvent;

/**
 * Handles TonConnect URLs from deep links or QR codes.
 */
export async function handleTonConnectUrl(args: HandleTonConnectUrlArgs) {
    return callBridge('handleTonConnectUrl', async (kit) => {
        return await kit.handleTonConnectUrl(args.url);
    });
}

/**
 * Retrieves active TonConnect sessions.
 * Session transformation handled by Kotlin SessionResponseParser.
 */
export async function listSessions() {
    return callBridge('listSessions', async (kit) => {
        const fetchedSessions = kit.listSessions ? await kit.listSessions() : [];
        const sessions = Array.isArray(fetchedSessions) ? fetchedSessions : [];
        return { items: sessions };
    });
}

/**
 * Disconnects a TonConnect session.
 */
export async function disconnectSession(args?: DisconnectSessionArgs) {
    return callBridge('disconnectSession', async (kit) => {
        if (kit.disconnect) {
            await kit.disconnect(args?.sessionId);
        }
        return { ok: true };
    });
}

/**
 * Processes requests from the in-app browser TonConnect bridge.
 * Domain resolution and request preparation handled by Kotlin InternalBrowserRequestProcessor.
 */
export async function processInternalBrowserRequest(args: ProcessInternalBrowserRequestArgs) {
    return callBridge('processInternalBrowserRequest', async (kit) => {
        // Extract origin (with scheme) from URL - SessionManager.getSessionByDomain expects a parseable URL
        const domain = args.url ? new URL(args.url).origin : 'internal-browser';

        const messageInfo: BridgeEventMessageInfo = {
            messageId: args.messageId,
            tabId: args.messageId,
            domain,
        };

        const request: InjectedToExtensionBridgeRequestPayload = {
            id: args.messageId,
            method: args.method,
            params: args.params ?? [],
        };

        if (kit.processInjectedBridgeRequest) {
            await kit.processInjectedBridgeRequest(messageInfo, request);
        } else {
            throw new Error('processInjectedBridgeRequest not available');
        }

        // Wait for response from jsBridgeTransport (via initialization.ts)
        return new Promise<TonConnectEventPayload>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Request timeout: ${args.messageId}`));
            }, 60000); // 60 second timeout

            const resolverMap = ensureInternalBrowserResolverMap();
            resolverMap.set(args.messageId, {
                resolve: (response: JsBridgeTransportMessage) => {
                    clearTimeout(timeoutId);
                    // Extract payload from BridgeResponse - that's the actual TonConnect event
                    if ('payload' in response && response.payload !== undefined) {
                        resolve(response.payload as TonConnectEventPayload);
                    } else if ('result' in response && response.result !== undefined) {
                        resolve(response.result as TonConnectEventPayload);
                    } else if ('event' in response) {
                        // BridgeEvent contains the event directly
                        resolve(response.event as TonConnectEventPayload);
                    } else {
                        // Fallback - shouldn't happen in normal flow
                        reject(new Error('Unexpected response format'));
                    }
                },
                reject: (error: Error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                },
            });
        });
    });
}
