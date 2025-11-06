/**
 * WalletKit initialization helpers used by the bridge entry point.
 */
import type {
  WalletKitBridgeInitConfig,
  CallContext,
  BridgePayload,
  WalletKitBridgeEvent,
} from '../types';
import {
  walletKit,
  setWalletKit,
  initialized,
  setInitialized,
  setCurrentNetwork,
  setCurrentApiBase,
  currentNetwork,
  currentApiBase,
} from './state';
import {
  ensureWalletKitLoaded,
  TonWalletKit,
  createWalletManifest,
  CreateTonMnemonic,
  Signer,
  WalletV4R2Adapter,
  WalletV5R1Adapter,
  Address,
  Cell,
  CHAIN,
  tonConnectChain,
} from './moduleLoader';
import { normalizeNetworkValue } from '../utils/network';

export interface InitTonWalletKitDeps {
  emitCallCheckpoint: (context: CallContext | undefined, message: string) => void;
  emit: (type: WalletKitBridgeEvent['type'], data?: WalletKitBridgeEvent['data']) => void;
  postToNative: (payload: BridgePayload) => void;
  AndroidStorageAdapter: new () => unknown;
}

/**
 * Initializes WalletKit with Android-specific configuration and wiring.
 *
 * @param config - Optional initialization configuration.
 * @param context - Diagnostic context for tracing native calls.
 * @param deps - Helper dependencies injected from the API layer.
 */
export async function initTonWalletKit(
  config: WalletKitBridgeInitConfig | undefined,
  context: CallContext | undefined,
  deps: InitTonWalletKitDeps,
): Promise<{ ok: true }> {
  if (initialized && walletKit) {
    deps.emitCallCheckpoint(context, 'initTonWalletKit:already-initialized');
    return { ok: true };
  }

  deps.emitCallCheckpoint(context, 'initTonWalletKit:begin');
  await ensureWalletKitLoaded();

  if (!CHAIN) {
    throw new Error('CHAIN constants not loaded');
  }

  const networkRaw = (config?.network as string | undefined) ?? 'testnet';
  const network = normalizeNetworkValue(networkRaw, CHAIN);
  setCurrentNetwork(network);

  const isMainnet = network === CHAIN.MAINNET;
  const tonApiUrl =
    config?.tonApiUrl ||
    config?.apiBaseUrl ||
    (isMainnet ? 'https://tonapi.io' : 'https://testnet.tonapi.io');
  const clientEndpoint =
    config?.tonClientEndpoint ||
    config?.apiUrl ||
    (isMainnet ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC');
  setCurrentApiBase(tonApiUrl);
  deps.emitCallCheckpoint(context, 'initTonWalletKit:constructing-tonwalletkit');

  const chains = tonConnectChain;
  if (!chains) {
    throw new Error('TON Connect chain constants unavailable');
  }
  const chain = isMainnet ? chains.MAINNET : chains.TESTNET;

  console.log('[walletkitBridge] initTonWalletKit config:', JSON.stringify(config, null, 2));

  let walletManifest = config?.walletManifest;
  console.log('[walletkitBridge] walletManifest from config:', walletManifest);

  if (!walletManifest && config?.bridgeUrl && typeof createWalletManifest === 'function') {
    console.log('[walletkitBridge] Creating wallet manifest with bridgeName:', config.bridgeName);
    walletManifest = createWalletManifest({
      bridgeUrl: config.bridgeUrl,
      name: config.bridgeName ?? 'Wallet',
      appName: config.bridgeName ?? 'Wallet',
    });
    console.log('[walletkitBridge] Created wallet manifest:', walletManifest);
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

  const resolvedBridgeUrl =
    config?.bridgeUrl ?? (walletManifest && typeof walletManifest === 'object' ? (walletManifest as any).bridgeUrl : undefined);

  if (resolvedBridgeUrl) {
    kitOptions.bridge = {
      bridgeUrl: resolvedBridgeUrl,
      jsBridgeTransport: async (sessionId: string, message: any) => {
        console.log('[walletkitBridge] 📤 jsBridgeTransport called:', {
          sessionId,
          messageType: message.type,
          messageId: message.messageId,
          hasPayload: !!message.payload,
          payloadEvent: message.payload?.event,
        });
        console.log('[walletkitBridge] 📤 Full message:', JSON.stringify(message, null, 2));

        if (
          message.type === 'TONCONNECT_BRIDGE_RESPONSE' &&
          message.payload?.event === 'disconnect' &&
          !message.messageId
        ) {
          console.log('[walletkitBridge] 🔄 Transforming disconnect response to event');
          message = {
            type: 'TONCONNECT_BRIDGE_EVENT',
            source: message.source,
            event: message.payload,
            traceId: message.traceId,
          };
          console.log('[walletkitBridge] 🔄 Transformed message:', JSON.stringify(message, null, 2));
        }

        if (message.messageId) {
          console.log('[walletkitBridge] 🔵 Message has messageId, checking for pending promise');
          const resolvers = (globalThis as any).__internalBrowserResponseResolvers;
          if (resolvers && resolvers.has(message.messageId)) {
            console.log('[walletkitBridge] ✅ Resolving response promise for messageId:', message.messageId);
            const { resolve } = resolvers.get(message.messageId);
            resolvers.delete(message.messageId);
            resolve(message);
          } else {
            console.warn('[walletkitBridge] ⚠️ No pending promise for messageId:', message.messageId);
          }
        }

        if (message.type === 'TONCONNECT_BRIDGE_EVENT') {
          console.log('[walletkitBridge] 📤 Sending event to WebView for session:', sessionId);
          deps.postToNative({
            kind: 'jsBridgeEvent',
            sessionId,
            event: message,
          });
          console.log('[walletkitBridge] ✅ Event sent successfully');
        }

        return Promise.resolve();
      },
    };
  }

  const nativeStorageBridge =
    (window as any).WalletKitNativeStorage ??
    ((window as any).WalletKitNative && typeof (window as any).WalletKitNative.storageGet === 'function'
      ? (window as any).WalletKitNative
      : undefined) ??
    (window as any).Android;

  const hasStorageMethods =
    nativeStorageBridge &&
    (typeof nativeStorageBridge.storageGet === 'function' || typeof nativeStorageBridge.getItem === 'function') &&
    (typeof nativeStorageBridge.storageSet === 'function' || typeof nativeStorageBridge.setItem === 'function');

  if (hasStorageMethods) {
    console.log('[walletkitBridge] Using Android native storage adapter');
    kitOptions.storage = new deps.AndroidStorageAdapter();
  } else if (config?.allowMemoryStorage) {
    console.log('[walletkitBridge] Using memory storage (sessions will not persist)');
    kitOptions.storage = {
      allowMemory: true,
    };
  }

  setWalletKit(new TonWalletKit(kitOptions));

  if (typeof walletKit.ensureInitialized === 'function') {
    deps.emitCallCheckpoint(context, 'initTonWalletKit:before-walletKit.ensureInitialized');
    await walletKit.ensureInitialized();
    deps.emitCallCheckpoint(context, 'initTonWalletKit:after-walletKit.ensureInitialized');
  }

  setInitialized(true);
  deps.emitCallCheckpoint(context, 'initTonWalletKit:initialized');
  const readyDetails = {
    network,
    tonApiUrl,
    tonClientEndpoint: clientEndpoint,
  };
  deps.emit('ready', readyDetails);
  deps.postToNative({ kind: 'ready', ...readyDetails });
  console.log('[walletkitBridge] WalletKit ready');
  deps.emitCallCheckpoint(context, 'initTonWalletKit:ready-dispatched');
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
