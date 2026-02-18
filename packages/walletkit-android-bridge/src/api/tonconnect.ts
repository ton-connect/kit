/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { kit } from '../utils/bridge';
import { ensureInternalBrowserResolverMap } from '../utils/internalBrowserResolvers';

export async function handleTonConnectUrl(args: string) {
    return kit('handleTonConnectUrl', args);
}

export async function listSessions() {
    return kit('listSessions');
}

export async function disconnectSession(args?: string) {
    return kit('disconnect', args);
}

/**
 * Processes internal browser TonConnect requests.
 * args: [messageInfo, request] where messageInfo has { messageId, tabId, domain }
 *
 * This function calls processInjectedBridgeRequest and then waits for the response
 * to come back via jsBridgeTransport (which resolves the promise via the resolver map).
 */
export async function processInternalBrowserRequest(args: unknown[]) {
    // Extract messageId from messageInfo (first element of args array)
    const messageInfo = args[0] as { messageId?: string } | undefined;
    const messageId = messageInfo?.messageId;

    if (!messageId) {
        throw new Error('processInternalBrowserRequest: messageId is required in messageInfo');
    }

    return new Promise<unknown>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            const resolverMap = ensureInternalBrowserResolverMap();
            resolverMap.delete(messageId);
            reject(new Error(`Request timeout: ${messageId}`));
        }, 60000); // 60 second timeout

        const resolverMap = ensureInternalBrowserResolverMap();
        resolverMap.set(messageId, {
            resolve: (response: unknown) => {
                clearTimeout(timeoutId);
                // Extract payload if present
                if (response && typeof response === 'object' && 'payload' in response) {
                    resolve((response as { payload?: unknown }).payload ?? response);
                } else {
                    resolve(response);
                }
            },
            reject: (error: unknown) => {
                clearTimeout(timeoutId);
                reject(error instanceof Error ? error : new Error(String(error)));
            },
        });

        // Call processInjectedBridgeRequest AFTER resolver is registered
        kit('processInjectedBridgeRequest', ...args).catch((err) => {
            clearTimeout(timeoutId);
            resolverMap.delete(messageId);
            reject(err);
        });
    });
}
