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

import type {
    WalletKitBridgeInitConfig,
    BridgePayload,
    WalletKitBridgeEvent,
    WalletKitInstance,
    JsBridgeTransportMessage,
} from '../types';
import { info, warn } from '../utils/logger';
import { walletKit, setWalletKit } from './state';
import { ensureWalletKitLoaded, TonWalletKit } from './moduleLoader';
import { getInternalBrowserResolverMap } from '../utils/internalBrowserResolvers';
import {
    hasAndroidSessionManager,
    AndroidTONConnectSessionsManager,
} from '../adapters/AndroidTONConnectSessionsManager';
import { AndroidAPIClientAdapter } from '../adapters/AndroidAPIClientAdapter';

interface InitTonWalletKitDeps {
    emit: (type: WalletKitBridgeEvent['type'], data?: WalletKitBridgeEvent['data']) => void;
    postToNative: (payload: BridgePayload) => void;
    AndroidStorageAdapter: new () => unknown;
}

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

    // Build networks config from networkConfigurations (like iOS bridge does)
    const networksConfig: Record<string, { apiClient?: { url?: string; key?: string } | AndroidAPIClientAdapter }> = {};

    if (config?.networkConfigurations && Array.isArray(config.networkConfigurations)) {
        for (const netConfig of config.networkConfigurations) {
            networksConfig[netConfig.network.chainId] = {
                apiClient: netConfig.apiClientConfiguration,
            };
        }
    }

    // Check if native API clients are available and use them if so
    if (AndroidAPIClientAdapter.isAvailable()) {
        const availableNetworks = AndroidAPIClientAdapter.getAvailableNetworks();

        for (const nativeNetwork of availableNetworks) {
            networksConfig[nativeNetwork.chainId] = {
                apiClient: new AndroidAPIClientAdapter(nativeNetwork),
            };
        }
    }

    const kitOptions: Record<string, unknown> = {
        networks: networksConfig,
    };

    const devOptions: Record<string, unknown> = {};
    if (config?.disableNetworkSend) {
        devOptions.disableNetworkSend = true;
    }
    if (Object.keys(devOptions).length > 0) {
        kitOptions.dev = devOptions;
    }

    if (config?.disableTransactionEmulation !== undefined) {
        kitOptions.eventProcessor = {
            disableTransactionEmulation: config.disableTransactionEmulation,
        };
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

                let bridgeMessage: JsBridgeTransportMessage = typedMessage;

                // Handle disconnect responses that need to be transformed to events
                const DISCONNECT_EVENT = 'disconnect';
                if (bridgeMessage.type === TONCONNECT_BRIDGE_RESPONSE) {
                    const responseMsg = bridgeMessage as BridgeResponse;
                    // BridgeResponse has 'result' field, not 'payload'
                    const result = responseMsg.result as { event?: string; id?: number } | undefined;

                    if (result?.event === DISCONNECT_EVENT && !responseMsg.messageId) {
                        bridgeMessage = {
                            type: TONCONNECT_BRIDGE_EVENT,
                            source: responseMsg.source,
                            event: {
                                event: 'disconnect',
                                id: result.id ?? 0,
                                payload: {},
                            },
                        } as BridgeEvent;
                    }
                }

                // Handle responses with messageId (internal browser requests)
                if (bridgeMessage.type === TONCONNECT_BRIDGE_RESPONSE && bridgeMessage.messageId) {
                    const resolvers = getInternalBrowserResolverMap();
                    const messageIdStr = String(bridgeMessage.messageId);
                    const resolver = resolvers?.get(messageIdStr);
                    if (resolver) {
                        resolvers?.delete(messageIdStr);
                        resolver.resolve(bridgeMessage);
                    } else {
                        warn('[walletkitBridge] No pending promise for messageId:', messageIdStr);
                    }
                }

                if (bridgeMessage.type === TONCONNECT_BRIDGE_EVENT) {
                    deps.postToNative({
                        kind: 'jsBridgeEvent',
                        sessionId,
                        event: bridgeMessage,
                    });
                }

                return Promise.resolve();
            },
        };
    }

    if (window.WalletKitNative) {
        kitOptions.storage = new deps.AndroidStorageAdapter();
    } else if (config?.allowMemoryStorage) {
        info('[walletkitBridge] Using memory storage (sessions will not persist)');
        kitOptions.storage = {
            allowMemory: true,
        };
    }

    // Set up custom session manager if native bridge provides session management
    if (hasAndroidSessionManager()) {
        kitOptions.sessionManager = new AndroidTONConnectSessionsManager();
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
    info('[walletkitBridge] WalletKit ready');
    return { ok: true };
}
