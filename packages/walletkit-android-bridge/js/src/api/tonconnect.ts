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
import { walletKit } from '../core/state';
import { resolveTonConnectUrl } from '../utils/parsing';
import { callBridge } from '../utils/bridgeWrapper';
import { ensureInternalBrowserResolverMap } from '../utils/internalBrowserResolvers';

/**
 * Handles TonConnect URLs from deep links or QR codes.
 */
export async function handleTonConnectUrl(args: HandleTonConnectUrlArgs) {
    return callBridge('handleTonConnectUrl', async () => {
        const url = resolveTonConnectUrl(args);
        if (!url) {
            throw new Error('TON Connect URL is missing');
        }

        return await walletKit.handleTonConnectUrl(url);
    });
}

/**
 * Retrieves active TonConnect sessions.
 * Session transformation handled by Kotlin SessionResponseParser.
 */
export async function listSessions() {
    return callBridge('listSessions', async () => {
        let sessions: unknown[] = [];
        if (typeof walletKit.listSessions === 'function') {
            const fetchedSessions = await walletKit.listSessions();
            sessions = Array.isArray(fetchedSessions) ? fetchedSessions : [];
        }

        return { items: sessions };
    });
}

/**
 * Disconnects a TonConnect session.
 */
export async function disconnectSession(args?: DisconnectSessionArgs) {
    return callBridge('disconnectSession', async () => {
        if (typeof walletKit.disconnect !== 'function') {
            throw new Error('walletKit.disconnect is not available');
        }

        await walletKit.disconnect(args?.sessionId);
        return { ok: true };
    });
}

/**
 * Processes requests from the in-app browser TonConnect bridge.
 * Domain resolution and request preparation handled by Kotlin InternalBrowserRequestProcessor.
 */
export async function processInternalBrowserRequest(args: ProcessInternalBrowserRequestArgs) {
    return callBridge('processInternalBrowserRequest', async () => {
        if (typeof walletKit.processInjectedBridgeRequest !== 'function') {
            throw new Error('walletKit.processInjectedBridgeRequest is not available');
        }

        let actualDomain = 'internal-browser';
        if (args.url) {
            try {
                const dappUrl = new URL(args.url);
                actualDomain = dappUrl.hostname;
            } catch {
                // Use default
            }
        }

        const messageInfo = {
            messageId: args.messageId,
            tabId: args.messageId,
            domain: actualDomain,
        };

        const finalParams = args.params;

        // Inject manifestUrl for connect requests if missing
        if (
            args.method === 'connect' &&
            args.manifestUrl &&
            finalParams &&
            typeof finalParams === 'object' &&
            !Array.isArray(finalParams)
        ) {
            const paramsObj = finalParams as Record<string, unknown>;
            const hasManifestUrl =
                paramsObj.manifestUrl ||
                (paramsObj.manifest &&
                    typeof paramsObj.manifest === 'object' &&
                    (paramsObj.manifest as Record<string, unknown>).url);

            if (!hasManifestUrl) {
                paramsObj.manifestUrl = args.manifestUrl;
            }
        }

        const request: Record<string, unknown> = {
            id: args.messageId,
            method: args.method,
            params: finalParams,
        };

        await walletKit.processInjectedBridgeRequest(messageInfo, request);

        // Wait for response from jsBridgeTransport
        const responsePromise = new Promise<unknown>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Request timeout: ${args.messageId}`));
            }, 60000);

            const resolverMap = ensureInternalBrowserResolverMap();
            resolverMap.set(args.messageId, {
                resolve: (response: unknown) => {
                    clearTimeout(timeoutId);
                    resolve(response);
                },
                reject: (error: unknown) => {
                    clearTimeout(timeoutId);
                    reject(error);
                },
            });
        });

        const response = await responsePromise;
        if (response && typeof response === 'object' && 'payload' in response) {
            const typed = response as { payload?: unknown };
            return typed.payload ?? response;
        }
        return response;
    });
}
