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

import type { HandleTonConnectUrlArgs, DisconnectSessionArgs, ProcessInternalBrowserRequestArgs } from '../types';
import { callBridge } from '../utils/bridgeWrapper';
import { ensureInternalBrowserResolverMap } from '../utils/internalBrowserResolvers';

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

        const messageInfo = {
            messageId: args.messageId,
            tabId: args.messageId,
            domain,
        };

        const request: Record<string, unknown> = {
            id: args.messageId,
            method: args.method,
            params: args.params,
        };

        if (kit.processInjectedBridgeRequest) {
            await kit.processInjectedBridgeRequest(messageInfo, request);
        } else {
            throw new Error('processInjectedBridgeRequest not available');
        }

        // Wait for response from jsBridgeTransport (via initialization.ts)
        return new Promise<unknown>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Request timeout: ${args.messageId}`));
            }, 60000); // 60 second timeout

            const resolverMap = ensureInternalBrowserResolverMap();
            resolverMap.set(args.messageId, {
                resolve: (response: unknown) => {
                    clearTimeout(timeoutId);
                    if (response && typeof response === 'object' && 'payload' in response) {
                        resolve((response as { payload?: unknown }).payload ?? response);
                    } else {
                        resolve(response);
                    }
                },
                reject: (error: unknown) => {
                    clearTimeout(timeoutId);
                    reject(error);
                },
            });
        });
    });
}
