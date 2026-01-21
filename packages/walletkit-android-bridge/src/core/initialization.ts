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
import { Network, TONCONNECT_BRIDGE_EVENT } from '@ton/walletkit';
import { TONCONNECT_BRIDGE_RESPONSE } from '@ton/walletkit/bridge';

import type { WalletKitBridgeInitConfig, BridgePayload, WalletKitBridgeEvent, WalletKitInstance } from '../types';
import { log, warn } from '../utils/logger';
import { walletKit, setWalletKit } from './state';
import { ensureWalletKitLoaded, TonWalletKit } from './moduleLoader';
import { getInternalBrowserResolverMap } from '../utils/internalBrowserResolvers';
import { isNativeSessionManagerAvailable, AndroidSessionManagerAdapter } from '../adapters/AndroidSessionManagerAdapter';

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
    const network = networkRaw === 'mainnet' ? Network.mainnet().chainId : Network.testnet().chainId;

    const tonApiUrl = config?.tonApiUrl || config?.apiBaseUrl;
    const clientEndpoint = config?.tonClientEndpoint || config?.apiUrl;

    log('[walletkitBridge] initTonWalletKit config:', JSON.stringify(config, null, 2));

    // Build networks config - the new SDK requires networks as an object keyed by chain ID
    const apiClientConfig = clientEndpoint ? { url: clientEndpoint } : undefined;
    const networksConfig: Record<string, { apiClient?: { url: string } }> = {
        [network]: { apiClient: apiClientConfig },
    };

    const kitOptions: Record<string, unknown> = {
        network,
        networks: networksConfig,
    };

    // Pass disableNetworkSend to dev options for testing
    if (config?.disableNetworkSend) {
        kitOptions.dev = { disableNetworkSend: true };
        log('[walletkitBridge] ⚠️ disableNetworkSend is enabled - transactions will be simulated only');
    }

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
                log('[walletkitBridge] 📤 jsBridgeTransport called:', {
                    sessionId,
                    messageType: message.type,
                    messageId: message.messageId,
                    hasPayload: !!message.payload,
                    payloadEvent: message.payload?.event,
                });
                log('[walletkitBridge] 📤 Full message:', JSON.stringify(message, null, 2));

                let bridgeMessage: JsBridgeMessage = message;

                if (
                    bridgeMessage.type === TONCONNECT_BRIDGE_RESPONSE &&
                    bridgeMessage.payload?.event === 'disconnect' &&
                    !bridgeMessage.messageId
                ) {
                    log('[walletkitBridge] 🔄 Transforming disconnect response to event');
                    bridgeMessage = {
                        type: TONCONNECT_BRIDGE_EVENT,
                        source: bridgeMessage.source,
                        event: bridgeMessage.payload,
                        traceId: bridgeMessage.traceId,
                    };
                    log('[walletkitBridge] 🔄 Transformed message:', JSON.stringify(bridgeMessage, null, 2));
                }

                if (bridgeMessage.messageId) {
                    log('[walletkitBridge] 🔵 Message has messageId, checking for pending promise');
                    const resolvers = getInternalBrowserResolverMap();
                    const resolver = resolvers?.get(bridgeMessage.messageId);
                    if (resolver) {
                        log('[walletkitBridge] ✅ Resolving response promise for messageId:', bridgeMessage.messageId);
                        resolvers?.delete(bridgeMessage.messageId);
                        resolver.resolve(bridgeMessage);
                    } else {
                        warn('[walletkitBridge] ⚠️ No pending promise for messageId:', bridgeMessage.messageId);
                    }
                }

                if (bridgeMessage.type === TONCONNECT_BRIDGE_EVENT) {
                    log('[walletkitBridge] 📤 Sending event to WebView for session:', sessionId);
                    deps.postToNative({
                        kind: 'jsBridgeEvent',
                        sessionId,
                        event: bridgeMessage,
                    });
                    log('[walletkitBridge] ✅ Event sent successfully');
                }

                return Promise.resolve();
            },
        };
    }

    if (window.WalletKitNative) {
        log('[walletkitBridge] Using Android native storage adapter');
        kitOptions.storage = new deps.AndroidStorageAdapter();

        // Check if native session manager is available (when host app provides custom session manager)
        if (isNativeSessionManagerAvailable()) {
            log('[walletkitBridge] Using Android native session manager adapter');
            kitOptions.sessionManager = new AndroidSessionManagerAdapter();
        }
    } else if (config?.allowMemoryStorage) {
        log('[walletkitBridge] Using memory storage (sessions will not persist)');
        kitOptions.storage = {
            allowMemory: true,
        };
    }

    if (!TonWalletKit) {
        throw new Error('TonWalletKit module not loaded');
    }
    setWalletKit(new TonWalletKit(kitOptions));

    if ((walletKit as unknown as WalletKitInstance)?.ensureInitialized) {
        await (walletKit as unknown as WalletKitInstance)?.ensureInitialized?.();
    }

    deps.emit('ready', { network: networkRaw, tonApiUrl, tonClientEndpoint: clientEndpoint });
    deps.postToNative({ kind: 'ready', network: networkRaw, tonApiUrl, tonClientEndpoint: clientEndpoint });
    log('[walletkitBridge] WalletKit ready');
    return { ok: true };
}

/**
 * Ensures WalletKit has been initialized before performing an operation.
 * Returns the initialized WalletKit instance for type-safe usage.
 *
 * @throws If WalletKit is not yet ready.
 */
export function requireWalletKit(): NonNullable<typeof walletKit> {
    if (!walletKit) {
        throw new Error('WalletKit not initialized');
    }
    return walletKit;
}
