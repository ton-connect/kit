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
import type { WalletKitBridgeInitConfig, BridgePayload, WalletKitBridgeEvent } from '../types';
import { debugLog, debugWarn } from '../utils/logger';
import { walletKit, setWalletKit, initialized, setInitialized, setCurrentNetwork, setCurrentApiBase } from './state';
import { ensureWalletKitLoaded, TonWalletKit, createWalletManifest, CHAIN, tonConnectChain } from './moduleLoader';
import { normalizeNetworkValue } from '../utils/network';
import { getInternalBrowserResolverMap } from '../utils/internalBrowserResolvers';

export interface InitTonWalletKitDeps {
    emit: (type: WalletKitBridgeEvent['type'], data?: WalletKitBridgeEvent['data']) => void;
    postToNative: (payload: BridgePayload) => void;
    AndroidStorageAdapter: new () => unknown;
}

type WalletManifestObject = {
    bridgeUrl?: string;
} & Record<string, unknown>;

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
    storageGet?: (key: string) => string | null;
    storageSet?: (key: string, value: string) => void;
    getItem?: (key: string) => string | null;
    setItem?: (key: string, value: string) => void;
};

type AndroidBridgeWindow = Window & {
    WalletKitNativeStorage?: NativeStorageBridge;
    WalletKitNative?: NativeStorageBridge;
    Android?: NativeStorageBridge;
};

function resolveManifestBridgeUrl(manifest: unknown): string | undefined {
    if (manifest && typeof manifest === 'object') {
        const manifestObj = manifest as WalletManifestObject;
        return typeof manifestObj.bridgeUrl === 'string' ? manifestObj.bridgeUrl : undefined;
    }
    return undefined;
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
    if (initialized && walletKit) {
        return { ok: true };
    }

    await ensureWalletKitLoaded();

    if (!CHAIN) {
        throw new Error('CHAIN constants not loaded');
    }

    const networkRaw = (config?.network as string | undefined) ?? 'testnet';
    const network = normalizeNetworkValue(networkRaw, CHAIN);
    setCurrentNetwork(networkRaw); // Store the original string value

    const isMainnet = network === CHAIN.MAINNET;
    // URLs are now set by Android WalletKit core with proper defaults
    const tonApiUrl = config?.tonApiUrl || config?.apiBaseUrl;
    const clientEndpoint = config?.tonClientEndpoint || config?.apiUrl;
    if (tonApiUrl) {
        setCurrentApiBase(tonApiUrl);
    }

    const chains = tonConnectChain;
    if (!chains) {
        throw new Error('TON Connect chain constants unavailable');
    }
    const chain = isMainnet ? chains.MAINNET : chains.TESTNET;

    debugLog('[walletkitBridge] initTonWalletKit config:', JSON.stringify(config, null, 2));

    let walletManifest = config?.walletManifest;
    debugLog('[walletkitBridge] walletManifest from config:', walletManifest);

    if (!walletManifest && config?.bridgeUrl && typeof createWalletManifest === 'function') {
        debugLog('[walletkitBridge] Creating wallet manifest with bridgeName:', config.bridgeName);
        walletManifest = createWalletManifest({
            bridgeUrl: config.bridgeUrl,
            name: config.bridgeName ?? 'Wallet',
            appName: config.bridgeName ?? 'Wallet',
        });
        debugLog('[walletkitBridge] Created wallet manifest:', walletManifest);
    }

    const kitOptions: Record<string, unknown> = {
        network: chain,
        apiClient: { url: clientEndpoint },
    };

    if (config?.deviceInfo) {
        kitOptions.deviceInfo = config.deviceInfo;
    }

    if (walletManifest) {
        kitOptions.walletManifest = walletManifest;
    }

    const resolvedBridgeUrl = config?.bridgeUrl ?? resolveManifestBridgeUrl(walletManifest);

    if (resolvedBridgeUrl) {
        kitOptions.bridge = {
            bridgeUrl: resolvedBridgeUrl,
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

    const androidWindow = window as AndroidBridgeWindow;
    const nativeStorageBridge =
        androidWindow.WalletKitNativeStorage ??
        (androidWindow.WalletKitNative && typeof androidWindow.WalletKitNative.storageGet === 'function'
            ? androidWindow.WalletKitNative
            : undefined) ??
        androidWindow.Android;

    const hasStorageMethods =
        nativeStorageBridge &&
        (typeof nativeStorageBridge.storageGet === 'function' || typeof nativeStorageBridge.getItem === 'function') &&
        (typeof nativeStorageBridge.storageSet === 'function' || typeof nativeStorageBridge.setItem === 'function');

    if (hasStorageMethods) {
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

    if (typeof walletKit.ensureInitialized === 'function') {
        await walletKit.ensureInitialized();
    }

    setInitialized(true);
    const readyDetails = {
        network: networkRaw, // Send the original string network value
        tonApiUrl,
        tonClientEndpoint: clientEndpoint,
    };
    deps.emit('ready', readyDetails);
    deps.postToNative({ kind: 'ready', ...readyDetails });
    debugLog('[walletkitBridge] WalletKit ready');
    return { ok: true };
}

/**
 * Ensures WalletKit has been initialized before performing an operation.
 *
 * @throws If WalletKit is not yet ready.
 */
export function requireWalletKit(): void {
    if (!initialized || !walletKit) {
        throw new Error('WalletKit not initialized');
    }
}
