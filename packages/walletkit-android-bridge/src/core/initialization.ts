/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * WalletKit initialization helpers used by the bridge entry point.
 */
import { CHAIN } from '@ton/walletkit';

import type { WalletKitBridgeInitConfig, BridgePayload, WalletKitBridgeEvent } from '../types';
import { debugLog, debugWarn } from '../utils/logger';
import { walletKit, setWalletKit } from './state';
import { ensureWalletKitLoaded, TonWalletKit } from './moduleLoader';
import { getInternalBrowserResolverMap } from '../utils/internalBrowserResolvers';

export interface InitTonWalletKitDeps {
    emit: (type: WalletKitBridgeEvent['type'], data?: WalletKitBridgeEvent['data']) => void;
    postToNative: (payload: BridgePayload) => void;
    AndroidStorageAdapter: new () => unknown;
}

type JsBridgeMessage = {
    type: string;
    messageId?: string;
    payload?: {
        event?: string;
        [key: string]: unknown;
    };
    source?: unknown;
    traceId?: string;
    [key: string]: unknown;
};

type NativeStorageBridge = {
    storageGet: (key: string) => string | null;
    storageSet: (key: string, value: string) => void;
};

type _AndroidBridgeWindow = Window & {
    WalletKitNative?: NativeStorageBridge;
};

/**
 * Initializes WalletKit with Android-specific configuration and wiring.
 *
 * @param config - Optional initialization configuration.
 * @param deps - Helper dependencies injected from the API layer.
 */
export async function initTonWalletKit(
    config: WalletKitBridgeInitConfig | undefined,
    deps: InitTonWalletKitDeps,
): Promise<{ ok: true }> {
    if (walletKit) {
        return { ok: true };
    }

    await ensureWalletKitLoaded();

    const networkRaw = (config?.network as string | undefined) ?? 'testnet';
    const network = networkRaw === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET;

    const tonApiUrl = config?.tonApiUrl || config?.apiBaseUrl;
    const clientEndpoint = config?.tonClientEndpoint || config?.apiUrl;

    debugLog('[walletkitBridge] initTonWalletKit config:', JSON.stringify(config, null, 2));

    const kitOptions: Record<string, unknown> = {
        network,
        apiClient: { url: clientEndpoint },
    };

    if (config?.deviceInfo) {
        kitOptions.deviceInfo = config.deviceInfo;
    }

    if (config?.walletManifest) {
        kitOptions.walletManifest = config.walletManifest;
    }

    if (config?.bridgeUrl) {
        kitOptions.bridge = {
            bridgeUrl: config.bridgeUrl,
            jsBridgeTransport: async (sessionId: string, message: JsBridgeMessage) => {
                debugLog('[walletkitBridge] 📤 jsBridgeTransport called:', {
                    sessionId,
                    messageType: message.type,
                    messageId: message.messageId,
                    hasPayload: !!message.payload,
                    payloadEvent: message.payload?.event,
                });
                debugLog('[walletkitBridge] 📤 Full message:', JSON.stringify(message, null, 2));

                let bridgeMessage: JsBridgeMessage = message;

                if (
                    bridgeMessage.type === 'TONCONNECT_BRIDGE_RESPONSE' &&
                    bridgeMessage.payload?.event === 'disconnect' &&
                    !bridgeMessage.messageId
                ) {
                    debugLog('[walletkitBridge] 🔄 Transforming disconnect response to event');
                    bridgeMessage = {
                        type: 'TONCONNECT_BRIDGE_EVENT',
                        source: bridgeMessage.source,
                        event: bridgeMessage.payload,
                        traceId: bridgeMessage.traceId,
                    };
                    debugLog('[walletkitBridge] 🔄 Transformed message:', JSON.stringify(bridgeMessage, null, 2));
                }

                if (bridgeMessage.messageId) {
                    debugLog('[walletkitBridge] 🔵 Message has messageId, checking for pending promise');
                    const resolvers = getInternalBrowserResolverMap();
                    const resolver = resolvers?.get(bridgeMessage.messageId);
                    if (resolver) {
                        debugLog(
                            '[walletkitBridge] ✅ Resolving response promise for messageId:',
                            bridgeMessage.messageId,
                        );
                        resolvers?.delete(bridgeMessage.messageId);
                        resolver.resolve(bridgeMessage);
                    } else {
                        debugWarn('[walletkitBridge] ⚠️ No pending promise for messageId:', bridgeMessage.messageId);
                    }
                }

                if (bridgeMessage.type === 'TONCONNECT_BRIDGE_EVENT') {
                    debugLog('[walletkitBridge] 📤 Sending event to WebView for session:', sessionId);
                    deps.postToNative({
                        kind: 'jsBridgeEvent',
                        sessionId,
                        event: bridgeMessage,
                    });
                    debugLog('[walletkitBridge] ✅ Event sent successfully');
                }

                return Promise.resolve();
            },
        };
    }

    if (window.WalletKitNative) {
        debugLog('[walletkitBridge] Using Android native storage adapter');
        kitOptions.storage = new deps.AndroidStorageAdapter();
    } else if (config?.allowMemoryStorage) {
        debugLog('[walletkitBridge] Using memory storage (sessions will not persist)');
        kitOptions.storage = {
            allowMemory: true,
        };
    }

    if (!TonWalletKit) {
        throw new Error('TonWalletKit module not loaded');
    }
    setWalletKit(new TonWalletKit(kitOptions));

    if (walletKit.ensureInitialized) {
        await walletKit.ensureInitialized();
    }

    deps.emit('ready', { network: networkRaw, tonApiUrl, tonClientEndpoint: clientEndpoint });
    deps.postToNative({ kind: 'ready', network: networkRaw, tonApiUrl, tonClientEndpoint: clientEndpoint });
    debugLog('[walletkitBridge] WalletKit ready');
    return { ok: true };
}

/**
 * Ensures WalletKit has been initialized before performing an operation.
 *
 * @throws If WalletKit is not yet ready.
 */
export function requireWalletKit(): void {
    if (!walletKit) {
        throw new Error('WalletKit not initialized');
    }
}
