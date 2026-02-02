/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JsBridgeTransportMessage } from '../types/bridge';

export type InternalBrowserResponseResolver = {
    resolve: (response: JsBridgeTransportMessage) => void;
    reject: (error: Error) => void;
};

export type InternalBrowserResolverRegistry = Map<string, InternalBrowserResponseResolver>;

type InternalBrowserGlobal = typeof globalThis & {
    __internalBrowserResponseResolvers?: InternalBrowserResolverRegistry;
};

const internalBrowserGlobal = globalThis as InternalBrowserGlobal;

export function getInternalBrowserResolverMap(): InternalBrowserResolverRegistry | undefined {
    return internalBrowserGlobal.__internalBrowserResponseResolvers;
}

export function ensureInternalBrowserResolverMap(): InternalBrowserResolverRegistry {
    if (!internalBrowserGlobal.__internalBrowserResponseResolvers) {
        internalBrowserGlobal.__internalBrowserResponseResolvers = new Map();
    }
    return internalBrowserGlobal.__internalBrowserResponseResolvers;
}

export function deleteInternalBrowserResolver(messageId: string): void {
    internalBrowserGlobal.__internalBrowserResponseResolvers?.delete(messageId);
}
