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
import type { BridgeResponse, BridgeEvent } from '@ton/walletkit';
import { TONCONNECT_BRIDGE_EVENT } from '@ton/walletkit';
import { TONCONNECT_BRIDGE_RESPONSE } from '@ton/walletkit/bridge';

import type { WalletKitBridgeInitConfig, BridgePayload, WalletKitBridgeEvent, WalletKitInstance, JsBridgeTransportMessage } from '../types';
import { log, warn } from '../utils/logger';
import { walletKit, setWalletKit } from './state';
import { ensureWalletKitLoaded, TonWalletKit } from './moduleLoader';
import { getInternalBrowserResolverMap } from '../utils/internalBrowserResolvers';
import {
    hasAndroidSessionManager,
    AndroidTONConnectSessionsManager,
} from '../adapters/AndroidTONConnectSessionsManager';
import { AndroidAPIClientAdapter } from '../adapters/AndroidAPIClientAdapter';

export interface InitTonWalletKitDeps {
    emit: (type: WalletKitBridgeEvent['type'], data?: WalletKitBridgeEvent['data']) => void;
    postToNative: (payload: BridgePayload) => void;
    AndroidStorageAdapter: new () => unknown;
}

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

    log('[walletkitBridge] initTonWalletKit config:', JSON.stringify(config, null, 2));

    // Build networks config from networkConfigurations (like iOS bridge does)
    const networksConfig: Record<string, { apiClient?: { url?: string; key?: string } | AndroidAPIClientAdapter }> = {};

    if (config?.networkConfigurations && Array.isArray(config.networkConfigurations)) {
        for (const netConfig of config.networkConfigurations) {
            networksConfig[netConfig.network.chainId] = {
                apiClient: netConfig.apiClientConfiguration,
            };
            log('[walletkitBridge] Added network from networkConfigurations:', netConfig.network.chainId);
        }
    }

    // Check if native API clients are available and use them if so
    if (AndroidAPIClientAdapter.isAvailable()) {
        log('[walletkitBridge] Native API clients available, checking for configured networks');
        const availableNetworks = AndroidAPIClientAdapter.getAvailableNetworks();
        log('[walletkitBridge] Available native API networks:', JSON.stringify(availableNetworks));

        for (const nativeNetwork of availableNetworks) {
            log('[walletkitBridge] Using native API client for network:', nativeNetwork.chainId);
            networksConfig[nativeNetwork.chainId] = {
                apiClient: new AndroidAPIClientAdapter(nativeNetwork),
            };
        }
    }

    const kitOptions: Record<string, unknown> = {
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
            jsBridgeTransport: async (sessionId: string, message: unknown) => {
                // Cast to our transport message type (walletkit types this as unknown)
                const typedMessage = message as JsBridgeTransportMessage;
                
                log('[walletkitBridge] 📤 jsBridgeTransport called:', {
                    sessionId,
                    messageType: typedMessage.type,
                    hasPayload: 'payload' in typedMessage,
                });
                log('[walletkitBridge] 📤 Full message:', JSON.stringify(typedMessage, null, 2));

                let bridgeMessage: JsBridgeTransportMessage = typedMessage;

                // Handle disconnect responses that need to be transformed to events
                if (bridgeMessage.type === TONCONNECT_BRIDGE_RESPONSE) {
                    const responseMsg = bridgeMessage as BridgeResponse;
                    const payload = responseMsg.payload as { event?: string; id?: number } | undefined;
                    
                    if (payload?.event === 'disconnect' && !responseMsg.messageId) {
                        log('[walletkitBridge] 🔄 Transforming disconnect response to event');
                        bridgeMessage = {
                            type: TONCONNECT_BRIDGE_EVENT,
                            source: responseMsg.source,
                            event: {
                                event: 'disconnect',
                                id: payload.id ?? 0,
                                payload: {},
                            },
                            traceId: responseMsg.traceId,
                        } as BridgeEvent;
                        log('[walletkitBridge] 🔄 Transformed message:', JSON.stringify(bridgeMessage, null, 2));
                    }
                }

                // Handle responses with messageId (internal browser requests)
                if (bridgeMessage.type === TONCONNECT_BRIDGE_RESPONSE && bridgeMessage.messageId) {
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
    } else if (config?.allowMemoryStorage) {
        log('[walletkitBridge] Using memory storage (sessions will not persist)');
        kitOptions.storage = {
            allowMemory: true,
        };
    }

    // Set up custom session manager if native bridge provides session management
    if (hasAndroidSessionManager()) {
        log('[walletkitBridge] Using Android native session manager');
        kitOptions.sessionManager = new AndroidTONConnectSessionsManager();
    } else {
        log('[walletkitBridge] Using default WalletKit session manager');
    }

    if (!TonWalletKit) {
        throw new Error('TonWalletKit module not loaded');
    }
    setWalletKit(new TonWalletKit(kitOptions));

    if ((walletKit as unknown as WalletKitInstance)?.ensureInitialized) {
        await (walletKit as unknown as WalletKitInstance)?.ensureInitialized?.();
    }

    deps.emit('ready', {});
    deps.postToNative({ kind: 'ready' });
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
