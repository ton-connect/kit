import type { WalletKitBridgeEvent, WalletKitBridgeInitConfig } from './types';
import { AndroidStorageAdapter } from './AndroidStorageAdapter';

/**
 * JSON replacer to handle BigInt serialization
 * Converts BigInt values to strings to prevent "Do not know how to serialize Bigint" errors
 */
function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

const walletKitModulePromise = import('@ton/walletkit');
const tonCoreModulePromise = import('@ton/core');

let TonWalletKit: any;
let createWalletInitConfigMnemonic: any;
let createWalletManifest: any;
let CreateTonMnemonic: any;
let Signer: any;
let WalletV4R2Adapter: any;
let WalletV5R1Adapter: any;
let Address: any;
let Cell: any;
let CHAIN: any; // CHAIN enum from @ton/walletkit
let currentNetwork: string = ''; // Will be set to CHAIN.TESTNET or CHAIN.MAINNET after init
let currentApiBase = 'https://testnet.tonapi.io';
type TonChainEnum = { MAINNET: number; TESTNET: number };
let tonConnectChain: TonChainEnum | null = null;

async function ensureWalletKitLoaded() {
  if (TonWalletKit && createWalletInitConfigMnemonic && tonConnectChain && CHAIN && Address && Cell && Signer && WalletV4R2Adapter && WalletV5R1Adapter) {
    return;
  }
  if (!TonWalletKit || !createWalletInitConfigMnemonic || !Signer || !WalletV4R2Adapter || !WalletV5R1Adapter || !CHAIN) {
    const module = await walletKitModulePromise;
    TonWalletKit = (module as any).TonWalletKit;
    createWalletInitConfigMnemonic = (module as any).createWalletInitConfigMnemonic;
  CreateTonMnemonic = (module as any).CreateTonMnemonic ?? (module as any).CreateTonMnemonic;
    createWalletManifest = (module as any).createWalletManifest ?? createWalletManifest;
    CHAIN = (module as any).CHAIN; // Load CHAIN enum
    tonConnectChain = (module as any).CHAIN ?? tonConnectChain;
    Signer = (module as any).Signer;
    WalletV4R2Adapter = (module as any).WalletV4R2Adapter;
    WalletV5R1Adapter = (module as any).WalletV5R1Adapter;
  }
  // Load Address and Cell from @ton/core
  if (!Address || !Cell) {
    const coreModule = await tonCoreModulePromise;
    Address = (coreModule as any).Address;
    Cell = (coreModule as any).Cell;
  }
  if (!tonConnectChain || !CHAIN) {
    const module = await walletKitModulePromise;
    tonConnectChain = (module as any).CHAIN ?? null;
    CHAIN = (module as any).CHAIN;
    if (!tonConnectChain || !CHAIN) {
      throw new Error('TonWalletKit did not expose CHAIN enum');
    }
  }
}

// Normalize network input (accept legacy names but return CHAIN enum values)
function normalizeNetworkValue(n?: string | null): string {
  if (!n) return CHAIN.TESTNET;
  if (n === CHAIN.MAINNET) return CHAIN.MAINNET;
  if (n === CHAIN.TESTNET) return CHAIN.TESTNET;
  if (typeof n === 'string') {
    const lowered = n.toLowerCase();
    if (lowered === 'mainnet') return CHAIN.MAINNET;
    if (lowered === 'testnet') return CHAIN.TESTNET;
  }
  // default to testnet
  return CHAIN.TESTNET;
}

// Helper to convert raw address (0:hex) to user-friendly format (UQ...)
function toUserFriendlyAddress(rawAddress: string | null): string | null {
  if (!rawAddress || !Address) return rawAddress;
  try {
    const addr = Address.parse(rawAddress);
    return addr.toString({ bounceable: false, testOnly: currentNetwork === CHAIN.TESTNET });
  } catch (e) {
    console.warn('[walletkitBridge] Failed to parse address:', rawAddress, e);
    return rawAddress;
  }
}

// Helper to convert base64 hash to hex
function base64ToHex(base64: string): string {
  try {
    // Decode base64 to binary string
    const binaryString = atob(base64);
    let hex = '';
    for (let i = 0; i < binaryString.length; i++) {
      const hexByte = binaryString.charCodeAt(i).toString(16).padStart(2, '0');
      hex += hexByte;
    }
    return hex;
  } catch (e) {
    console.warn('[walletkitBridge] Failed to convert hash to hex:', base64, e);
    return base64;
  }
}

// Helper to extract text comment from message body
function extractTextComment(messageBody: string | null): string | null {
  if (!messageBody || !Cell) return null;
  try {
    const cell = Cell.fromBase64(messageBody);
    const slice = cell.beginParse();
    
    // Check if it starts with 0x00000000 (text comment opcode)
    const opcode = slice.loadUint(32);
    if (opcode === 0) {
      // Read the rest as a string
      return slice.loadStringTail();
    }
    return null;
  } catch (e) {
    // Not a text comment or failed to parse
    return null;
  }
}

type WalletKitApiMethod = keyof typeof api;

type BridgePayload =
  | { kind: 'response'; id: string; result?: unknown; error?: { message: string } }
  | { kind: 'event'; event: WalletKitBridgeEvent }
  | {
      kind: 'ready';
      network?: string;
      tonApiUrl?: string;
      tonClientEndpoint?: string;
      source?: string;
      timestamp?: number;
    }
  | {
      kind: 'diagnostic-call';
      id: string;
      method: WalletKitApiMethod;
      stage: 'start' | 'checkpoint' | 'success' | 'error';
      timestamp: number;
      message?: string;
    }
  | { kind: 'jsBridgeEvent'; sessionId: string; event: any };

declare global {
  interface Window {
    walletkitBridge?: typeof api;
    __walletkitCall?: (id: string, method: WalletKitApiMethod, paramsJson?: string | null) => void;
    WalletKitNative?: { postMessage: (json: string) => void };
    AndroidBridge?: { postMessage: (json: string) => void };
  }
}

type CallContext = {
  id: string;
  method: WalletKitApiMethod;
};

let walletKit: any | null = null;
let initialized = false;

function resolveTonConnectUrl(input: unknown): string | null {
  console.log('[walletkitBridge] resolveTonConnectUrl called with input type:', typeof input);
  if (input == null) {
    console.log('[walletkitBridge] input is null/undefined');
    return null;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    console.log('[walletkitBridge] input is string, trimmed:', trimmed.substring(0, 100));
    if (!trimmed) {
      return null;
    }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return resolveTonConnectUrl(parsed);
      } catch (_error) {
        return null;
      }
    }
    return trimmed;
  }

  if (Array.isArray(input)) {
    console.log('[walletkitBridge] input is array, length:', input.length);
    for (const item of input) {
      const resolved = resolveTonConnectUrl(item);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }

  if (typeof input === 'object') {
    console.log('[walletkitBridge] input is object, keys:', Object.keys(input));
    const record = input as Record<string, unknown>;
    const candidates = [
      record.url,
      record.href,
      record.link,
      record.location,
      record.requestUrl,
      record.tonconnectUrl,
      record.value,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed) {
          console.log('[walletkitBridge] found candidate URL:', trimmed.substring(0, 100));
          return trimmed;
        }
      }
    }

    const nestedSources = [record.params, record.payload, record.data, record.body];
    for (const source of nestedSources) {
      const resolved = resolveTonConnectUrl(source);
      if (resolved) {
        return resolved;
      }
    }
  }

  console.log('[walletkitBridge] no URL found in input');
  return null;
}

function resolveGlobalScope(): typeof globalThis {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof window !== 'undefined') {
    return window as typeof globalThis;
  }
  if (typeof self !== 'undefined') {
    return self as typeof globalThis;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {} as any;
}

function resolveNativeBridge(scope: typeof globalThis) {
  const candidate = (scope as typeof globalThis & { WalletKitNative?: { postMessage?: (json: string) => void } }).WalletKitNative;
  if (candidate && typeof candidate.postMessage === 'function') {
    return candidate.postMessage.bind(candidate);
  }
  const windowRef = typeof scope.window === 'object' && scope.window ? scope.window : undefined;
  const windowCandidate = windowRef?.WalletKitNative;
  if (windowCandidate && typeof windowCandidate.postMessage === 'function') {
    return windowCandidate.postMessage.bind(windowCandidate);
  }
  return null;
}

function resolveAndroidBridge(scope: typeof globalThis) {
  const candidate = (scope as typeof globalThis & { AndroidBridge?: { postMessage?: (json: string) => void } }).AndroidBridge;
  if (candidate && typeof candidate.postMessage === 'function') {
    return candidate.postMessage.bind(candidate);
  }
  const windowRef = typeof scope.window === 'object' && scope.window ? scope.window : undefined;
  const windowCandidate = windowRef?.AndroidBridge;
  if (windowCandidate && typeof windowCandidate.postMessage === 'function') {
    return windowCandidate.postMessage.bind(windowCandidate);
  }
  return null;
}

function postToNative(payload: BridgePayload) {
  if (payload === null || (typeof payload !== 'object' && typeof payload !== 'function')) {
    const diagnostic = {
      type: typeof payload,
      value: payload,
      stack: new Error('postToNative non-object payload').stack,
    };
    console.error('[walletkitBridge] postToNative received non-object payload', diagnostic);
    throw new Error('Invalid payload - must be an object');
  }
  const json = JSON.stringify(payload, bigIntReplacer);
  const scope = resolveGlobalScope();
  const nativePostMessage = resolveNativeBridge(scope);
  if (nativePostMessage) {
    nativePostMessage(json);
    return;
  }
  const androidPostMessage = resolveAndroidBridge(scope);
  if (androidPostMessage) {
    androidPostMessage(json);
    return;
  }
  // If neither bridge is available, throw error for events (not for diagnostics/ready)
  if (payload.kind === 'event') {
    throw new Error('Native bridge not available - cannot deliver event');
  }
  // For non-critical messages (diagnostics, ready), just log
  console.debug('[walletkitBridge] → native (no handler)', payload);
}

function emitCallDiagnostic(id: string, method: WalletKitApiMethod, stage: 'start' | 'checkpoint' | 'success' | 'error', message?: string) {
  postToNative({
    kind: 'diagnostic-call',
    id,
    method,
    stage,
    timestamp: Date.now(),
    message,
  });
}

function emitCallCheckpoint(context: CallContext | undefined, message: string) {
  if (!context) return;
  emitCallDiagnostic(context.id, context.method, 'checkpoint', message);
}

function emit(type: WalletKitBridgeEvent['type'], data?: WalletKitBridgeEvent['data']) {
  const event: WalletKitBridgeEvent = { type, data };
  
  // Send to native immediately - native side is responsible for storing events
  postToNative({ kind: 'event', event });
}

function respond(id: string, result?: unknown, error?: { message: string }) {
  console.log('[walletkitBridge] 🟢 respond() called with:');
  console.log('[walletkitBridge] 🟢 id:', id);
  console.log('[walletkitBridge] 🟢 result:', result);
  console.log('[walletkitBridge] 🟢 error:', error);
  console.log('[walletkitBridge] 🟢 About to call postToNative...');
  postToNative({ kind: 'response', id, result, error });
  console.log('[walletkitBridge] 🟢 postToNative completed');
}

async function handleCall(id: string, method: WalletKitApiMethod, params?: unknown) {
  emitCallDiagnostic(id, method, 'start');
  try {
    console.log(`[walletkitBridge] handleCall ${method}, looking up api[${method}]`);
    const fn = api[method];
    console.log(`[walletkitBridge] fn found:`, typeof fn);
    if (typeof fn !== 'function') throw new Error(`Unknown method ${String(method)}`);
    const context: CallContext = { id, method };
    console.log(`[walletkitBridge] about to call fn for ${method}`);
    const value = await (fn as (args: unknown, context?: CallContext) => Promise<unknown> | unknown).call(api, params as never, context);
    console.log(`[walletkitBridge] fn returned for ${method}`);
    console.log(`[walletkitBridge] 🔵 fn returned value:`, value);
    console.log(`[walletkitBridge] 🔵 value type:`, typeof value);
    emitCallDiagnostic(id, method, 'success');
    console.log(`[walletkitBridge] 🔵 About to call respond(id, value)...`);
    respond(id, value);
    console.log(`[walletkitBridge] 🔵 respond(id, value) completed`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[walletkitBridge] handleCall error for ${method}:`, err);
    console.error(`[walletkitBridge] error type:`, typeof err);
    console.error(`[walletkitBridge] error message:`, message);
    console.error(`[walletkitBridge] error stack:`, err instanceof Error ? err.stack : 'no stack');
    emitCallDiagnostic(id, method, 'error', message);
    respond(id, undefined, { message });
  }
}

window.__walletkitCall = (id, method, paramsJson) => {
  let params: unknown = undefined;
  if (paramsJson && paramsJson !== 'null') {
    try {
      params = JSON.parse(paramsJson);
    } catch (err) {
      respond(id, undefined, { message: 'Invalid params JSON' });
      return;
    }
  }
  void handleCall(id, method, params);
};

async function initTonWalletKit(config?: WalletKitBridgeInitConfig, context?: CallContext) {
  if (initialized && walletKit) {
    emitCallCheckpoint(context, 'initTonWalletKit:already-initialized');
    return { ok: true };
  }
  emitCallCheckpoint(context, 'initTonWalletKit:begin');
  // Normalize network to numeric chain id
  const networkRaw = (config?.network as string | undefined) ?? 'testnet';
  const network = normalizeNetworkValue(networkRaw);
  currentNetwork = network;
  const isMainnet = network === CHAIN.MAINNET;
  const tonApiUrl = config?.tonApiUrl || config?.apiBaseUrl || (isMainnet ? 'https://tonapi.io' : 'https://testnet.tonapi.io');
  const clientEndpoint = config?.tonClientEndpoint || config?.apiUrl || (isMainnet ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC');
  currentApiBase = tonApiUrl;
  emitCallCheckpoint(context, 'initTonWalletKit:constructing-tonwalletkit');
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
    config?.bridgeUrl ?? (walletManifest && typeof walletManifest === 'object' ? walletManifest.bridgeUrl : undefined);
  if (resolvedBridgeUrl) {
    kitOptions.bridge = {
      bridgeUrl: resolvedBridgeUrl,
      // Provide custom JS bridge transport for Android WebView
      // This is called when WalletKit needs to send responses back to the injected bridge
      // For Android, sessionId identifies which WebView should receive the event
      jsBridgeTransport: async (sessionId: string, message: any) => {
        console.log('[walletkitBridge] 📤 jsBridgeTransport called:', {
          sessionId,
          messageType: message.type,
          messageId: message.messageId,
          hasPayload: !!message.payload,
          payloadEvent: message.payload?.event,
        });
        console.log('[walletkitBridge] 📤 Full message:', JSON.stringify(message, null, 2));
        
        // Transform disconnect responses into events (for Android adapter)
        // Core sends disconnect as a response with payload.event='disconnect', but Android expects an event
        if (message.type === 'TONCONNECT_BRIDGE_RESPONSE' && 
            message.payload?.event === 'disconnect' && 
            !message.messageId) {
          console.log('[walletkitBridge] 🔄 Transforming disconnect response to event');
          message = {
            type: 'TONCONNECT_BRIDGE_EVENT',
            source: message.source,
            event: message.payload,
            traceId: message.traceId,
          };
          console.log('[walletkitBridge] � Transformed message:', JSON.stringify(message, null, 2));
        }
        
        // For responses with a messageId (replies to requests)
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
        
        // For events (like disconnect initiated by wallet), route to specific WebView via Kotlin
        if (message.type === 'TONCONNECT_BRIDGE_EVENT') {
          console.log('[walletkitBridge] 📤 Sending event to WebView for session:', sessionId);
          
          postToNative({ 
            kind: 'jsBridgeEvent',
            sessionId,  // Use sessionId parameter to route to correct WebView
            event: message 
          });
          console.log('[walletkitBridge] ✅ Event sent successfully');
        }
        
        return Promise.resolve();
      }
    };
  }

  // Use Android native storage if available, otherwise fall back to memory
  const nativeStorageBridge =
    (window as any).WalletKitNativeStorage ??
    ((window as any).WalletKitNative && typeof (window as any).WalletKitNative.storageGet === 'function'
      ? (window as any).WalletKitNative
      : undefined) ??
    (window as any).Android;

  const hasStorageMethods =
    nativeStorageBridge &&
    (typeof nativeStorageBridge.storageGet === 'function' ||
      typeof nativeStorageBridge.getItem === 'function') &&
    (typeof nativeStorageBridge.storageSet === 'function' ||
      typeof nativeStorageBridge.setItem === 'function');

  if (hasStorageMethods) {
    console.log('[walletkitBridge] Using Android native storage adapter');
    kitOptions.storage = new AndroidStorageAdapter();
  } else if (config?.allowMemoryStorage) {
    console.log('[walletkitBridge] Using memory storage (sessions will not persist)');
    kitOptions.storage = {
      allowMemory: true,
    };
  }

  walletKit = new TonWalletKit(kitOptions);

  if (typeof walletKit.ensureInitialized === 'function') {
    emitCallCheckpoint(context, 'initTonWalletKit:before-walletKit.ensureInitialized');
    await walletKit.ensureInitialized();
    emitCallCheckpoint(context, 'initTonWalletKit:after-walletKit.ensureInitialized');
  }

  // Event listeners are now set up on demand via setEventsListeners()
  // This allows native side to control when/how events are routed
  
  initialized = true;
  emitCallCheckpoint(context, 'initTonWalletKit:initialized');
  const readyDetails = {
    network,
    tonApiUrl,
    tonClientEndpoint: clientEndpoint,
  };
  emit('ready', readyDetails);
  postToNative({ kind: 'ready', ...readyDetails });
  console.log('[walletkitBridge] WalletKit ready');
  emitCallCheckpoint(context, 'initTonWalletKit:ready-dispatched');
  return { ok: true };
}

function requireWalletKit() {
  if (!initialized || !walletKit) {
    throw new Error('WalletKit not initialized');
  }
}

const api = {
  // Event listener references stored on the API object (like iOS stores on window.walletKit)
  onConnectListener: null as ((event: any) => void) | null,
  onTransactionListener: null as ((event: any) => void) | null,
  onSignDataListener: null as ((event: any) => void) | null,
  onDisconnectListener: null as ((event: any) => void) | null,

  async init(config?: WalletKitBridgeInitConfig, context?: CallContext) {
    emitCallCheckpoint(context, 'init:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'init:after-ensureWalletKitLoaded');
    emitCallCheckpoint(context, 'init:before-initTonWalletKit');
    const result = await initTonWalletKit(config, context);
    emitCallCheckpoint(context, 'init:after-initTonWalletKit');
    return result;
  },

  setEventsListeners(args?: { callback?: (type: string, event: any) => void }, context?: CallContext) {
    requireWalletKit();
    console.log('[walletkitBridge] 🔔 Setting up event listeners');
    
    // Determine callback: use provided callback or default to emit()
    const callback = args?.callback || ((type: string, event: any) => {
      emit(type as any, event);
    });

    // Remove old listener if it exists
    if (this.onConnectListener) {
      walletKit.removeConnectRequestCallback();
    }
    
    this.onConnectListener = (event: any) => {
      console.log('[walletkitBridge] 📨 Connect request received');
      callback('connectRequest', event);
    };
    
    walletKit.onConnectRequest(this.onConnectListener);
    console.log('[walletkitBridge] ✅ Connect listener registered');

    // Remove old listener if it exists
    if (this.onTransactionListener) {
      walletKit.removeTransactionRequestCallback();
    }
    
    this.onTransactionListener = (event: any) => {
      console.log('[walletkitBridge] 📨 Transaction request received');
      callback('transactionRequest', event);
    };
    
    console.log('[walletkitBridge] About to call walletKit.onTransactionRequest...');
    walletKit.onTransactionRequest(this.onTransactionListener);
    console.log('[walletkitBridge] ✅ Transaction listener registered');

    // Remove old listener if it exists
    if (this.onSignDataListener) {
      walletKit.removeSignDataRequestCallback();
    }
    
    this.onSignDataListener = (event: any) => {
      console.log('[walletkitBridge] 📨 Sign data request received');
      callback('signDataRequest', event);
    };
    
    console.log('[walletkitBridge] About to call walletKit.onSignDataRequest...');
    walletKit.onSignDataRequest(this.onSignDataListener);
    console.log('[walletkitBridge] ✅ Sign data listener registered');

    // Remove old listener if it exists
    if (this.onDisconnectListener) {
      walletKit.removeDisconnectCallback();
    }
    
    this.onDisconnectListener = (event: any) => {
      console.log('[walletkitBridge] 📨 Disconnect event received');
      callback('disconnect', event);
    };
    
    walletKit.onDisconnect(this.onDisconnectListener);
    console.log('[walletkitBridge] ✅ Disconnect listener registered');
    
    console.log('[walletkitBridge] ✅ Event listeners set up successfully');
    return { ok: true };
  },

  removeEventListeners(_?: unknown, context?: CallContext) {
    requireWalletKit();
    console.log('[walletkitBridge] 🗑️ Removing all event listeners');
    
    if (this.onConnectListener) {
      walletKit.removeConnectRequestCallback();
      this.onConnectListener = null;
    }
    
    if (this.onTransactionListener) {
      walletKit.removeTransactionRequestCallback();
      this.onTransactionListener = null;
    }
    
    if (this.onSignDataListener) {
      walletKit.removeSignDataRequestCallback();
      this.onSignDataListener = null;
    }
    
    if (this.onDisconnectListener) {
      walletKit.removeDisconnectCallback();
      this.onDisconnectListener = null;
    }
    
    console.log('[walletkitBridge] ✅ All event listeners removed');
    return { ok: true };
  },

  async derivePublicKeyFromMnemonic(args: { mnemonic: string[] }, context?: CallContext) {
    emitCallCheckpoint(context, 'derivePublicKeyFromMnemonic:start');
    await ensureWalletKitLoaded();
    
    const signer = await Signer.fromMnemonic(args.mnemonic, { type: 'ton' });
    
    emitCallCheckpoint(context, 'derivePublicKeyFromMnemonic:complete');
    return { publicKey: signer.publicKey };
  },

  async signDataWithMnemonic(
    args: { words: string[]; data: number[]; mnemonicType?: 'ton' | 'bip39' },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'signDataWithMnemonic:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'signDataWithMnemonic:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'signDataWithMnemonic:after-requireWalletKit');

    if (!args?.words || args.words.length === 0) {
      throw new Error('Mnemonic words required for signDataWithMnemonic');
    }
    if (!Array.isArray(args.data)) {
      throw new Error('Data array required for signDataWithMnemonic');
    }

    const signer = await Signer.fromMnemonic(args.words, { type: args.mnemonicType ?? 'ton' });
    emitCallCheckpoint(context, 'signDataWithMnemonic:after-createSigner');

    const dataBytes = Uint8Array.from(args.data);
    const signatureResult = await signer.sign(dataBytes);
    emitCallCheckpoint(context, 'signDataWithMnemonic:after-sign');

    let signatureBytes: Uint8Array;
    if (typeof signatureResult === 'string') {
      signatureBytes = hexToBytes(signatureResult);
    } else if (signatureResult instanceof Uint8Array) {
      signatureBytes = signatureResult;
    } else if (Array.isArray(signatureResult)) {
      signatureBytes = Uint8Array.from(signatureResult);
    } else {
      throw new Error('Unsupported signature format from signer');
    }

    return { signature: Array.from(signatureBytes) };
  },

  async createTonMnemonic(args: { count?: number } = { count: 24 }, context?: CallContext) {
    emitCallCheckpoint(context, 'createTonMnemonic:start');
    await ensureWalletKitLoaded();
    // CreateTonMnemonic is exported by @ton/walletkit and returns string[] (24 words)
    const mnemonicResult = await CreateTonMnemonic();
    const words = Array.isArray(mnemonicResult) ? mnemonicResult : `${mnemonicResult}`.split(' ').filter(Boolean);
    emitCallCheckpoint(context, 'createTonMnemonic:complete');
    return { items: words };
  },

  async addWalletFromMnemonic(
  args: { words: string[]; version: 'v5r1' | 'v4r2'; network?: string },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'addWalletFromMnemonic:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'addWalletFromMnemonic:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'addWalletFromMnemonic:after-requireWalletKit');
    const chains = tonConnectChain;
    if (!chains) {
      throw new Error('TON Connect chain constants unavailable');
    }
    // Support both network names (mainnet/testnet) and chain IDs (-239/-3)
  // Normalize network input (accept legacy names but convert to CHAIN enum values)
  const networkValue = normalizeNetworkValue(args.network as string | undefined);
  const isMainnet = networkValue === CHAIN.MAINNET;
  const chain = isMainnet ? chains.MAINNET : chains.TESTNET;
    
    // Create wallet adapter based on version
    let walletAdapter: any;
    emitCallCheckpoint(context, 'addWalletFromMnemonic:before-createWalletAdapter');
    
    if (args.version === 'v4r2') {
      const signer = await Signer.fromMnemonic(args.words, { type: 'ton' });
      walletAdapter = await WalletV4R2Adapter.create(signer, {
        client: walletKit.getApiClient(),
        network: chain,
      });
    } else if (args.version === 'v5r1') {
      const signer = await Signer.fromMnemonic(args.words, { type: 'ton' });
      walletAdapter = await WalletV5R1Adapter.create(signer, {
        client: walletKit.getApiClient(),
        network: chain,
      });
    } else {
      throw new Error('Unsupported wallet version: ${args.version}');
    }
    
    emitCallCheckpoint(context, 'addWalletFromMnemonic:after-createWalletAdapter');
    emitCallCheckpoint(context, 'addWalletFromMnemonic:before-walletKit.addWallet');
    await walletKit.addWallet(walletAdapter);
    emitCallCheckpoint(context, 'addWalletFromMnemonic:after-walletKit.addWallet');
    return { ok: true };
  },

  async addWalletWithSigner(
    args: { 
      publicKey: string; 
      version: 'v5r1' | 'v4r2'; 
      network?: string;
      signerId: string; // Unique ID for this signer, will be included in sign events
    },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'addWalletWithSigner:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'addWalletWithSigner:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'addWalletWithSigner:after-requireWalletKit');
    
    const chains = tonConnectChain;
    if (!chains) {
      throw new Error('TON Connect chain constants unavailable');
    }
    
  const networkValue = normalizeNetworkValue(args.network as string | undefined);
  const isMainnet = networkValue === CHAIN.MAINNET;
  const chain = isMainnet ? chains.MAINNET : chains.TESTNET;
    
    // Store pending sign requests
    const pendingSignRequests = new Map<string, { resolve: (sig: Uint8Array) => void; reject: (err: Error) => void }>();
    
    // Normalize public key - ensure it has 0x prefix (like Signer.fromMnemonic returns)
    const publicKeyHex = args.publicKey.startsWith('0x') ? args.publicKey : `0x${args.publicKey}`;
    
    // Create a custom signer that calls back to Android via events
    const customSigner: any = {
      sign: async (bytes: Uint8Array) => {
        // Generate unique request ID
        const requestId = `sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Emit sign request event to Android
        emit('signerSignRequest', {
          signerId: args.signerId,
          requestId: requestId,
          data: Array.from(bytes), // Convert to array for JSON serialization
        });
        
        // Wait for Android to respond with signature
        return new Promise<Uint8Array>((resolve, reject) => {
          pendingSignRequests.set(requestId, { resolve, reject });
          
          // Timeout after 60 seconds
          setTimeout(() => {
            if (pendingSignRequests.has(requestId)) {
              pendingSignRequests.delete(requestId);
              reject(new Error('Sign request timed out'));
            }
          }, 60000);
        });
      },
      publicKey: publicKeyHex, // Must be hex string with 0x prefix (same format as Signer.fromMnemonic)
    };
    
    // Store the pending requests map so Android can respond
    if (!(globalThis as any).__walletKitSignerRequests) {
      (globalThis as any).__walletKitSignerRequests = new Map();
    }
    (globalThis as any).__walletKitSignerRequests.set(args.signerId, pendingSignRequests);
    
    // Create wallet adapter based on version
    let walletAdapter: any;
    emitCallCheckpoint(context, 'addWalletWithSigner:before-createWalletAdapter');
    
    if (args.version === 'v4r2') {
      walletAdapter = await WalletV4R2Adapter.create(customSigner, {
        client: walletKit.getApiClient(),
        network: chain,
      });
    } else if (args.version === 'v5r1') {
      walletAdapter = await WalletV5R1Adapter.create(customSigner, {
        client: walletKit.getApiClient(),
        network: chain,
      });
    } else {
      throw new Error('Unsupported wallet version: ${args.version}');
    }
    
    emitCallCheckpoint(context, 'addWalletWithSigner:after-createWalletAdapter');
    emitCallCheckpoint(context, 'addWalletWithSigner:before-walletKit.addWallet');
    await walletKit.addWallet(walletAdapter);
    emitCallCheckpoint(context, 'addWalletWithSigner:after-walletKit.addWallet');
    return { ok: true };
  },

  async respondToSignRequest(
    args: {
      signerId: string;
      requestId: string;
      signature?: number[] | string;
      error?: string;
    },
    _context?: CallContext,
  ) {
    const signerRequests = (globalThis as any).__walletKitSignerRequests?.get(args.signerId);
    if (!signerRequests) {
      throw new Error('Unknown signer ID: ${args.signerId}');
    }
    
    const pending = signerRequests.get(args.requestId);
    if (!pending) {
      throw new Error('Unknown sign request ID: ${args.requestId}');
    }
    
    signerRequests.delete(args.requestId);
    
    if (args.error) {
      pending.reject(new Error(args.error));
    } else if (typeof args.signature === 'string') {
      pending.resolve(normalizeHex(args.signature));
    } else if (Array.isArray(args.signature)) {
      const signatureHex = bytesToHex(new Uint8Array(args.signature));
      pending.resolve(signatureHex);
    } else {
      pending.reject(new Error('No signature or error provided'));
    }
    
    return { ok: true };
  },

  async createV4R2WalletUsingMnemonic(
  args: { mnemonic: string[]; network?: string },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'createV4R2WalletUsingMnemonic:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createV4R2WalletUsingMnemonic:after-ensureWalletKitLoaded');
    requireWalletKit();
    if (!args.mnemonic) {
      throw new Error('Mnemonic required for mnemonic wallet type');
    }
    const chains = tonConnectChain;
    if (!chains) {
      throw new Error('TON Connect chain constants unavailable');
    }
  const networkValue = normalizeNetworkValue(args.network as string | undefined);
  const isMainnet = networkValue === CHAIN.MAINNET;
  const chain = isMainnet ? chains.MAINNET : chains.TESTNET;
    const signer = await Signer.fromMnemonic(args.mnemonic, { type: 'ton' });
    return await WalletV4R2Adapter.create(signer, {
      client: walletKit.getApiClient(),
      network: chain,
    });
  },

  async createV4R2WalletUsingSecretKey(
  args: { secretKey: string; network?: string },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'createV4R2WalletUsingSecretKey:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createV4R2WalletUsingSecretKey:after-ensureWalletKitLoaded');
    requireWalletKit();
    if (!args.secretKey) {
      throw new Error('Secret key required for secret key wallet type');
    }
    const chains = tonConnectChain;
    if (!chains) {
      throw new Error('TON Connect chain constants unavailable');
    }
  const networkValue = normalizeNetworkValue(args.network as string | undefined);
  const isMainnet = networkValue === CHAIN.MAINNET;
  const chain = isMainnet ? chains.MAINNET : chains.TESTNET;
    const signer = await Signer.fromPrivateKey(args.secretKey);
    return await WalletV4R2Adapter.create(signer, {
      client: walletKit.getApiClient(),
      network: chain,
    });
  },

  async createV5R1WalletUsingMnemonic(
  args: { mnemonic: string[]; network?: string },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'createV5R1WalletUsingMnemonic:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createV5R1WalletUsingMnemonic:after-ensureWalletKitLoaded');
    requireWalletKit();
    if (!args.mnemonic) {
      throw new Error('Mnemonic required for mnemonic wallet type');
    }
    const chains = tonConnectChain;
    if (!chains) {
      throw new Error('TON Connect chain constants unavailable');
    }
  const networkValue = normalizeNetworkValue(args.network as string | undefined);
  const isMainnet = networkValue === CHAIN.MAINNET;
  const chain = isMainnet ? chains.MAINNET : chains.TESTNET;
    const signer = await Signer.fromMnemonic(args.mnemonic, { type: 'ton' });
    return await WalletV5R1Adapter.create(signer, {
      client: walletKit.getApiClient(),
      network: chain,
    });
  },

  async createV5R1WalletUsingSecretKey(
  args: { secretKey: string; network?: string },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'createV5R1WalletUsingSecretKey:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createV5R1WalletUsingSecretKey:after-ensureWalletKitLoaded');
    requireWalletKit();
    if (!args.secretKey) {
      throw new Error('Secret key required for secret key wallet type');
    }
    const chains = tonConnectChain;
    if (!chains) {
      throw new Error('TON Connect chain constants unavailable');
    }
  const networkValue = normalizeNetworkValue(args.network as string | undefined);
  const isMainnet = networkValue === CHAIN.MAINNET;
  const chain = isMainnet ? chains.MAINNET : chains.TESTNET;
    const signer = await Signer.fromPrivateKey(args.secretKey);
    return await WalletV5R1Adapter.create(signer, {
      client: walletKit.getApiClient(),
      network: chain,
    });
  },

  async addWallet(
    args: { wallet: any },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'addWallet:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'addWallet:after-ensureWalletKitLoaded');
    requireWalletKit();
    if (!args.wallet) {
      throw new Error('Wallet required for wallet addition');
    }
    emitCallCheckpoint(context, 'addWallet:before-walletKit.addWallet');
    await walletKit.addWallet(args.wallet);
    emitCallCheckpoint(context, 'addWallet:after-walletKit.addWallet');
    return { ok: true };
  },

  async getWallets(_?: unknown, context?: CallContext) {
    emitCallCheckpoint(context, 'getWallets:enter');
    requireWalletKit();
    emitCallCheckpoint(context, 'getWallets:after-requireWalletKit');
    if (typeof walletKit.ensureInitialized === 'function') {
      emitCallCheckpoint(context, 'getWallets:before-walletKit.ensureInitialized');
      await walletKit.ensureInitialized();
      emitCallCheckpoint(context, 'getWallets:after-walletKit.ensureInitialized');
    }
    const wallets = walletKit.getWallets?.() || [];
    emitCallCheckpoint(context, 'getWallets:after-walletKit.getWallets');
    return wallets.map((wallet: any, index: number) => ({
      address: wallet.getAddress(),
      publicKey: Array.from(wallet.publicKey as Uint8Array)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join(''),
      version: typeof wallet.version === 'string' ? wallet.version : 'unknown',
      index,
      network: currentNetwork,
    }));
  },

  async removeWallet(args: { address: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'removeWallet:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'removeWallet:after-ensureWalletKitLoaded');
    requireWalletKit();
    const address = args.address?.trim();
    if (!address) {
      throw new Error('Wallet address is required');
    }
    const wallet = walletKit.getWallet?.(address);
    if (!wallet) {
      return { removed: false };
    }
    emitCallCheckpoint(context, 'removeWallet:before-walletKit.removeWallet');
    await walletKit.removeWallet(address);
    emitCallCheckpoint(context, 'removeWallet:after-walletKit.removeWallet');

    return { removed: true };
  },

  async getWalletState(args: { address: string }, context?: CallContext) {
    requireWalletKit();
    if (typeof walletKit.ensureInitialized === 'function') {
      emitCallCheckpoint(context, 'getWalletState:before-walletKit.ensureInitialized');
      await walletKit.ensureInitialized();
      emitCallCheckpoint(context, 'getWalletState:after-walletKit.ensureInitialized');
    }
    const wallet = walletKit.getWallet(args.address);
    if (!wallet) throw new Error('Wallet not found');
    emitCallCheckpoint(context, 'getWalletState:before-wallet.getBalance');
    const balance = await wallet.getBalance();
    emitCallCheckpoint(context, 'getWalletState:after-wallet.getBalance');
    console.log('[walletkitBridge] balance type:', typeof balance);
    console.log('[walletkitBridge] balance value:', balance);
    console.log('[walletkitBridge] balance.toString type:', typeof balance?.toString);
    const balanceStr = balance != null && typeof balance.toString === 'function' ? balance.toString() : String(balance);
    console.log('[walletkitBridge] balanceStr:', balanceStr);
    const transactions = wallet.getTransactions ? await wallet.getTransactions(10) : [];
    emitCallCheckpoint(context, 'getWalletState:after-wallet.getTransactions');
    return { balance: balanceStr, transactions };
  },

  async getRecentTransactions(
    args: { address: string; limit?: number },
    context?: CallContext,
  ): Promise<{ items: unknown[] }> {
    emitCallCheckpoint(context, 'getRecentTransactions:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'getRecentTransactions:after-ensureWalletKitLoaded');
    requireWalletKit();
    const address = args.address?.trim();
    if (!address) {
      throw new Error('Wallet address is required');
    }
    const wallet = walletKit.getWallet?.(address);
    if (!wallet) {
      throw new Error(`Wallet not found for address ${address}`);
    }
    const limit = Number.isFinite(args.limit) && (args.limit as number) > 0 ? Math.floor(args.limit as number) : 10;
    
    console.log('[walletkitBridge] getRecentTransactions fetching transactions for address:', address);
    emitCallCheckpoint(context, 'getRecentTransactions:before-client.getAccountTransactions');
    
    // Use wallet.client.getAccountTransactions - address must be an array
    const response = await wallet.client.getAccountTransactions({
      address: [address], // Must be an array!
      limit,
    });
    
    // Response has structure: { transactions: [...], address_book: {...} }
    const transactions = response?.transactions || [];
    console.log('[walletkitBridge] getRecentTransactions fetched:', transactions.length, 'transactions');
    console.log('[walletkitBridge] Address helper available:', !!Address, 'Cell helper available:', !!Cell);
    
    // Log structure of first transaction
    if (transactions.length > 0) {
      const firstTx = transactions[0];
      console.log('[walletkitBridge] First tx keys:', Object.keys(firstTx).join(', '));
      if (firstTx.in_msg) {
        console.log('[walletkitBridge] in_msg keys:', Object.keys(firstTx.in_msg).join(', '));
        if (firstTx.in_msg.message_content) {
          console.log('[walletkitBridge] in_msg.message_content keys:', Object.keys(firstTx.in_msg.message_content).join(', '));
        }
      }
    }
    
    // Process transactions to add user-friendly addresses and extract comments
    const processedTransactions = transactions.map((tx: any, idx: number) => {
      // Convert hash from base64 to hex
      if (tx.hash) {
        tx.hash_hex = base64ToHex(tx.hash);
      }
      
      // Convert addresses to user-friendly format
      if (tx.in_msg?.source) {
        const rawAddr = tx.in_msg.source;
        const friendlyAddr = toUserFriendlyAddress(rawAddr);
        tx.in_msg.source_friendly = friendlyAddr;
        if (idx === 0) {
          console.log('[walletkitBridge] Converting source address:', rawAddr, '→', friendlyAddr);
        }
      }
      if (tx.in_msg?.destination) {
        const rawAddr = tx.in_msg.destination;
        const friendlyAddr = toUserFriendlyAddress(rawAddr);
        tx.in_msg.destination_friendly = friendlyAddr;
        if (idx === 0) {
          console.log('[walletkitBridge] Converting destination address:', rawAddr, '→', friendlyAddr);
        }
      }
      
      // Process outgoing messages
      if (tx.out_msgs && Array.isArray(tx.out_msgs)) {
        tx.out_msgs = tx.out_msgs.map((msg: any) => {
          const processed = { ...msg };
          if (msg.source) {
            processed.source_friendly = toUserFriendlyAddress(msg.source);
          }
          if (msg.destination) {
            processed.destination_friendly = toUserFriendlyAddress(msg.destination);
          }
          // Try to extract comment from message body
          if (msg.message_content?.body) {
            const comment = extractTextComment(msg.message_content.body);
            if (comment) {
              processed.comment = comment;
            }
          }
          return processed;
        });
      }
      
      // Try to extract comment from incoming message
      if (tx.in_msg?.message_content?.body) {
        const body = tx.in_msg.message_content.body;
        if (idx === 0) {
          console.log('[walletkitBridge] in_msg.message_content.body exists, type:', typeof body, 'value:', body ? body.substring(0, 100) : 'null');
        }
        const comment = extractTextComment(body);
        if (comment) {
          tx.in_msg.comment = comment;
          if (idx === 0) {
            console.log('[walletkitBridge] Extracted comment from in_msg:', comment);
          }
        } else if (idx === 0) {
          console.log('[walletkitBridge] No comment extracted from body');
        }
      } else if (idx === 0) {
        console.log('[walletkitBridge] No in_msg.message_content.body - keys:', tx.in_msg ? Object.keys(tx.in_msg) : 'no in_msg');
      }
      
      return tx;
    });
    
    if (processedTransactions.length > 0) {
      console.log('[walletkitBridge] First transaction after processing - hash_hex:', processedTransactions[0].hash_hex);
      console.log('[walletkitBridge] First transaction after processing - in_msg.source_friendly:', processedTransactions[0].in_msg?.source_friendly);
      console.log('[walletkitBridge] First transaction after processing - in_msg.comment:', processedTransactions[0].in_msg?.comment);
    }
    
    if (processedTransactions.length > 0) {
      console.log('[walletkitBridge] First transaction sample:', JSON.stringify(processedTransactions[0]).substring(0, 800));
    }
    emitCallCheckpoint(context, 'getRecentTransactions:after-client.getAccountTransactions');
    return { items: Array.isArray(processedTransactions) ? processedTransactions : [] };
  },

  async handleTonConnectUrl(args: unknown, context?: CallContext) {
    console.log('[walletkitBridge] handleTonConnectUrl called with args:', args);
    emitCallCheckpoint(context, 'handleTonConnectUrl:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'handleTonConnectUrl:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'handleTonConnectUrl:after-requireWalletKit');
    const url = resolveTonConnectUrl(args);
    console.log('[walletkitBridge] resolved URL:', url);
    if (!url) {
      throw new Error('TON Connect URL is missing');
    }
    console.log('[walletkitBridge] calling walletKit.handleTonConnectUrl with:', url);
    try {
      const result = await walletKit.handleTonConnectUrl(url);
      console.log('[walletkitBridge] handleTonConnectUrl result:', result);
      return result;
    } catch (err) {
      console.error('[walletkitBridge] handleTonConnectUrl error:', err);
      console.error('[walletkitBridge] error type:', typeof err);
      console.error('[walletkitBridge] error message:', err instanceof Error ? err.message : String(err));
      console.error('[walletkitBridge] error stack:', err instanceof Error ? err.stack : 'no stack');
      throw err;
    }
  },

  async sendLocalTransaction(
    args: { walletAddress: string; toAddress: string; amount: string; comment?: string },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'sendLocalTransaction:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'sendLocalTransaction:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'sendLocalTransaction:after-requireWalletKit');

    const walletAddress =
      typeof args.walletAddress === 'string' ? args.walletAddress.trim() : String(args.walletAddress ?? '').trim();
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const toAddress =
      typeof args.toAddress === 'string' ? args.toAddress.trim() : String(args.toAddress ?? '').trim();
    if (!toAddress) {
      throw new Error('Recipient address is required');
    }

    const amount =
      typeof args.amount === 'string' ? args.amount.trim() : String(args.amount ?? '').trim();
    if (!amount) {
      throw new Error('Amount is required');
    }

    const wallet = walletKit.getWallet?.(walletAddress);
    if (!wallet) {
      throw new Error(`Wallet not found for address ${walletAddress}`);
    }

    const transferParams: Record<string, unknown> = {
      toAddress,
      amount,
    };

    const comment = typeof args.comment === 'string' ? args.comment.trim() : '';
    if (comment) {
      transferParams.comment = comment;
    }

    emitCallCheckpoint(context, 'sendLocalTransaction:before-wallet.createTransferTonTransaction');
    const transaction = await wallet.createTransferTonTransaction(transferParams);
    emitCallCheckpoint(context, 'sendLocalTransaction:after-wallet.createTransferTonTransaction');

    // Add comment to transaction messages for UI display (doesn't affect blockchain encoding)
    if (comment && transaction.messages && Array.isArray(transaction.messages)) {
      transaction.messages = transaction.messages.map((msg: any) => ({
        ...msg,
        comment: comment,
      }));
    }

    let preview: unknown = null;
    if (typeof wallet.getTransactionPreview === 'function') {
      try {
        emitCallCheckpoint(context, 'sendLocalTransaction:before-wallet.getTransactionPreview');
        const previewResult = await wallet.getTransactionPreview(transaction);
        preview = previewResult?.preview ?? previewResult;
        emitCallCheckpoint(context, 'sendLocalTransaction:after-wallet.getTransactionPreview');
      } catch (error) {
        console.warn('[walletkitBridge] getTransactionPreview failed', error);
      }
    }

    // handleNewTransaction triggers onTransactionRequest event
    // Android app should listen to transactionRequest event to show confirmation UI with fee details
    // User then calls approveTransactionRequest or rejectTransactionRequest
    emitCallCheckpoint(context, 'sendLocalTransaction:before-walletKit.handleNewTransaction');
    await walletKit.handleNewTransaction(wallet, transaction);
    emitCallCheckpoint(context, 'sendLocalTransaction:after-walletKit.handleNewTransaction');

    // This returns immediately after queuing the transaction request
    // The actual transaction is sent only when approveTransactionRequest is called
    return {
      success: true,
      transaction,
      preview,
    };
  },

  async approveConnectRequest(args: { event: any; walletAddress: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'approveConnectRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'approveConnectRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'approveConnectRequest:after-requireWalletKit');
    
    // Ensure bridge is initialized before approving connect request
    if (typeof walletKit.ensureInitialized === 'function') {
      console.log('ensureInitialized');
      emitCallCheckpoint(context, 'approveConnectRequest:before-walletKit.ensureInitialized');
      await walletKit.ensureInitialized();
      console.log('await this.initializationPromise');
      emitCallCheckpoint(context, 'approveConnectRequest:after-walletKit.ensureInitialized');
      console.log('ensureInitialized done');
    }
    
    const event = args.event;
    if (!event) {
      throw new Error('Connect request event is required');
    }
    const wallet = walletKit.getWallet?.(args.walletAddress);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    const resolvedAddress =
      (typeof wallet.getAddress === 'function' ? wallet.getAddress() : wallet.address) || args.walletAddress;
    event.wallet = wallet;
    event.walletAddress = resolvedAddress;
    
    // CRITICAL: Determine if this is an internal browser (JS bridge) vs deep link (HTTP bridge) event
    // Android doesn't pass back the full event object with all fields, so we need to detect the type
    // 
    // The problem: Android only sends back: id, preview, request, dAppInfo, walletAddress, wallet
    // It doesn't preserve isJsBridge, domain, tabId, messageId fields
    //
    // Key difference between connection types:
    // - Deep link/QR (HTTP bridge): Event has a 'from' field (dApp's client session ID from the URL)
    // - Internal browser (JS bridge): Event has NO 'from' field (wallet generates the session ID)
    //
    // The 'from' field comes from the TON Connect URL's client_id parameter, which only exists
    // for HTTP bridge connections. Internal browser connections don't have this.
    
    const hasSessionId = !!(event.request?.from || event.from);
    const manifestUrl = event.preview?.manifest?.url || event.dAppInfo?.url || '';
    
    // Internal browser detection:
    // - No 'from' field (wallet will generate session ID)
    // - OR manifestUrl is empty/local
    const isInternalBrowser = !hasSessionId || 
                              !manifestUrl ||
                              manifestUrl.includes('localhost') ||
                              manifestUrl.includes('127.0.0.1') ||
                              manifestUrl.includes('appassets.androidplatform.net');
    
    console.log('[walletkitBridge] 🔍 Event type detection:', {
      hasSessionId,
      manifestUrl,
      from: event.request?.from || event.from,
      isInternalBrowser,
      eventId: event.id,
    });
    
    // Restore JS bridge fields for internal browser events
    if (isInternalBrowser) {
      console.log('[walletkitBridge] 🔧 Restoring missing JS bridge fields for internal browser event');
      
      // Set JS bridge flag
      event.isJsBridge = true;
      
      // CRITICAL: Use the domain from the event if available (it was set when the event was first emitted)
      // The domain should have been preserved by the Kotlin layer
      let actualDomain = event.domain || 'internal-browser';
      
      // Only try to resolve from window if domain is missing from event
      if (!event.domain) {
        console.log('[walletkitBridge] ⚠️ Domain missing from event, attempting to resolve from window');
        try {
          if (typeof window !== 'undefined') {
            // Try to get the domain from the top window (the actual dApp page)
            if (window.top && window.top !== window && window.top.location) {
              actualDomain = window.top.location.hostname;
            } else if (document.referrer) {
              // Fallback to document.referrer which should contain the dApp URL
              const referrerUrl = new URL(document.referrer);
              actualDomain = referrerUrl.hostname;
            } else if (window.location && window.location.hostname !== 'appassets.androidplatform.net') {
              // Only use window.location if it's not the assets domain
              actualDomain = window.location.hostname;
            }
          }
        } catch (e) {
          console.log('[walletkitBridge] Could not access parent domain, using fallback:', e);
        }
      } else {
        console.log('[walletkitBridge] ✅ Using domain from event:', event.domain);
      }
      
      console.log('[walletkitBridge] Resolved domain for connect:', actualDomain);
      event.domain = actualDomain;
      
      // tabId is used as sessionId for sendJsBridgeResponse
      // Use the event.id as tabId since that's what was used in messageInfo when queuing
      event.tabId = event.id;
      
      // messageId is used for the bridge response
      event.messageId = event.id;
      
      console.log('[walletkitBridge] ✅ Restored fields - isJsBridge:', event.isJsBridge, 'domain:', event.domain, 'tabId:', event.tabId, 'messageId:', event.messageId);
    } else {
      console.log('[walletkitBridge] ℹ️ Deep link/QR event - will use HTTP bridge for response');
    }
    
    emitCallCheckpoint(context, 'approveConnectRequest:before-walletKit.approveConnectRequest');
    const result = await walletKit.approveConnectRequest(event);
    // Some internal implementations (request processor) perform the response
    // delivery themselves and return no value. Treat undefined/null result as
    // implicit success to avoid throwing while the dApp already received the
    // response (this prevents spurious "Failed to approve connect request" errors).
    if (result == null) {
      emitCallCheckpoint(context, 'approveConnectRequest:after-walletKit.approveConnectRequest');
      return { success: true } as unknown as Record<string, unknown>;
    }
    if (!result?.success) {
      const message = result?.message || 'Failed to approve connect request';
      throw new Error(message);
    }
    emitCallCheckpoint(context, 'approveConnectRequest:after-walletKit.approveConnectRequest');
    return result;
  },

  async rejectConnectRequest(args: { event: any; reason?: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'rejectConnectRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'rejectConnectRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'rejectConnectRequest:after-requireWalletKit');
    const event = args.event;
    if (!event) {
      throw new Error('Connect request event is required');
    }
    const result = await walletKit.rejectConnectRequest(event, args.reason);
    // rejectConnectRequest returns Promise<void>, treat undefined/null as success
    if (result == null) {
      return { success: true };
    }
    if (!result?.success) {
      const message = result?.message || 'Failed to reject connect request';
      throw new Error(message);
    }
    return result;
  },

  async approveTransactionRequest(args: { event: any }, context?: CallContext) {
    emitCallCheckpoint(context, 'approveTransactionRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'approveTransactionRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = args.event;
    if (!event) {
      throw new Error('Transaction request event is required');
    }
    const result = await walletKit.approveTransactionRequest(event);
    return result;
  },

  async rejectTransactionRequest(args: { event: any; reason?: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'rejectTransactionRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'rejectTransactionRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = args.event;
    if (!event) {
      throw new Error('Transaction request event is required');
    }
    const result = await walletKit.rejectTransactionRequest(event, args.reason);
    // rejectTransactionRequest returns Promise<void>, treat undefined/null as success
    if (result == null) {
      return { success: true };
    }
    if (!result?.success) {
      const message = result?.message || 'Failed to reject transaction request';
      throw new Error(message);
    }
    return result;
  },

  async approveSignDataRequest(args: { event: any }, context?: CallContext) {
    emitCallCheckpoint(context, 'approveSignDataRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'approveSignDataRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = args.event;
    if (!event) {
      throw new Error('Sign data request event is required');
    }
    console.log('[bridge] Approving sign data request with event:', JSON.stringify(event, null, 2));
    const result = await walletKit.signDataRequest(event);
    console.log('[bridge] Sign data result:', JSON.stringify(result, null, 2));
    return result;
  },

  async rejectSignDataRequest(args: { event: any; reason?: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'rejectSignDataRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'rejectSignDataRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = args.event;
    if (!event) {
      throw new Error('Sign data request event is required');
    }
    const result = await walletKit.rejectSignDataRequest(event, args.reason);
    // rejectSignDataRequest returns Promise<void>, treat undefined/null as success
    if (result == null) {
      return { success: true };
    }
    if (!result?.success) {
      const message = result?.message || 'Failed to reject sign data request';
      throw new Error(message);
    }
    return result;
  },

  async listSessions(_?: unknown, context?: CallContext) {
    emitCallCheckpoint(context, 'listSessions:enter');
    requireWalletKit();
    let sessions: any[] = [];
    if (typeof walletKit.listSessions === 'function') {
      emitCallCheckpoint(context, 'listSessions:before-walletKit.listSessions');
      try {
        sessions = (await walletKit.listSessions()) ?? [];
        console.log('[walletkitBridge] listSessions raw result:', sessions);
        console.log('[walletkitBridge] listSessions count:', sessions.length);
      } catch (error) {
        console.error('[walletkitBridge] walletKit.listSessions failed', error);
        throw error;
      }
      emitCallCheckpoint(context, 'listSessions:after-walletKit.listSessions');
    } else {
      console.warn('[walletkitBridge] walletKit.listSessions is not a function');
    }
    const items = sessions.map((session: any) => {
      const sessionId = session.sessionId || session.id;
      const mapped = {
        sessionId,
        dAppName: session.dAppName || session.name || '',
        walletAddress: session.walletAddress,
        dAppUrl: session.dAppUrl || session.url || null,
        manifestUrl: session.manifestUrl || null,
        iconUrl: session.dAppIconUrl || session.iconUrl || null,
        createdAt: serializeDate(session.createdAt),
        lastActivity: serializeDate(session.lastActivity),
      };
      console.log('[walletkitBridge] Mapped session:', JSON.stringify(mapped));
      return mapped;
    });
    console.log('[walletkitBridge] Returning items count:', items.length);
    return { items };
  },

  async disconnectSession(args?: { sessionId?: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'disconnectSession:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'disconnectSession:after-ensureWalletKitLoaded');
    requireWalletKit();
    if (typeof walletKit.disconnect !== 'function') {
      throw new Error('walletKit.disconnect is not available');
    }
    emitCallCheckpoint(context, 'disconnectSession:before-walletKit.disconnect');
    await walletKit.disconnect(args?.sessionId);
    emitCallCheckpoint(context, 'disconnectSession:after-walletKit.disconnect');
    return { ok: true };
  },

  async getNfts(args: { address: string; limit?: number; offset?: number }, context?: CallContext) {
    emitCallCheckpoint(context, 'getNfts:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'getNfts:after-ensureWalletKitLoaded');
    requireWalletKit();
    
    const address = args.address?.trim();
    if (!address) {
      throw new Error('Wallet address is required');
    }
    
    const wallet = walletKit.getWallet?.(address);
    if (!wallet) {
      throw new Error(`Wallet not found for address ${address}`);
    }
    
    const limit = Number.isFinite(args.limit) && (args.limit as number) > 0 ? Math.floor(args.limit as number) : 100;
    const offset = Number.isFinite(args.offset) && (args.offset as number) >= 0 ? Math.floor(args.offset as number) : 0;
    
    console.log('[walletkitBridge] getNfts fetching NFTs for address:', address, 'limit:', limit, 'offset:', offset);
    emitCallCheckpoint(context, 'getNfts:before-wallet.getNfts');
    
    const result = await wallet.getNfts({ limit, offset });
    
    emitCallCheckpoint(context, 'getNfts:after-wallet.getNfts');
    console.log('[walletkitBridge] getNfts result:', result);
    
    return result;
  },

  async getNft(args: { address: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'getNft:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'getNft:after-ensureWalletKitLoaded');
    requireWalletKit();
    
    const nftAddress = args.address?.trim();
    if (!nftAddress) {
      throw new Error('NFT address is required');
    }
    
    // Get any wallet to access client methods (NFT lookups don't require wallet context)
    const wallets = walletKit.listWallets();
    if (!wallets || wallets.length === 0) {
      throw new Error('No wallets available');
    }
    
    const wallet = wallets[0];
    
    console.log('[walletkitBridge] getNft fetching NFT for address:', nftAddress);
    emitCallCheckpoint(context, 'getNft:before-wallet.getNft');
    
    const result = await wallet.getNft(nftAddress);
    
    emitCallCheckpoint(context, 'getNft:after-wallet.getNft');
    console.log('[walletkitBridge] getNft result:', result);
    
    return result || null;
  },

  async createTransferNftTransaction(
    args: { address: string; nftAddress: string; transferAmount: string; toAddress: string; comment?: string },
    context?: CallContext
  ) {
    emitCallCheckpoint(context, 'createTransferNftTransaction:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createTransferNftTransaction:after-ensureWalletKitLoaded');
    requireWalletKit();
    
    const address = args.address?.trim();
    if (!address) {
      throw new Error('Wallet address is required');
    }
    
    const wallet = walletKit.getWallet?.(address);
    if (!wallet) {
      throw new Error(`Wallet not found for address ${address}`);
    }
    
    console.log('[walletkitBridge] createTransferNftTransaction for NFT:', args.nftAddress, 'to:', args.toAddress);
    emitCallCheckpoint(context, 'createTransferNftTransaction:before-wallet.createTransferNftTransaction');
    
    const params = {
      nftAddress: args.nftAddress,
      transferAmount: args.transferAmount,
      toAddress: args.toAddress,
      comment: args.comment,
    };
    
    const result = await wallet.createTransferNftTransaction(params);
    
    emitCallCheckpoint(context, 'createTransferNftTransaction:after-wallet.createTransferNftTransaction');
    console.log('[walletkitBridge] createTransferNftTransaction result:', result);
    
    return result;
  },

  async createTransferNftRawTransaction(
    args: { address: string; nftAddress: string; transferAmount: string; transferMessage: any },
    context?: CallContext
  ) {
    emitCallCheckpoint(context, 'createTransferNftRawTransaction:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createTransferNftRawTransaction:after-ensureWalletKitLoaded');
    requireWalletKit();
    
    const address = args.address?.trim();
    if (!address) {
      throw new Error('Wallet address is required');
    }
    
    const wallet = walletKit.getWallet?.(address);
    if (!wallet) {
      throw new Error(`Wallet not found for address ${address}`);
    }
    
    console.log('[walletkitBridge] createTransferNftRawTransaction for NFT:', args.nftAddress);
    emitCallCheckpoint(context, 'createTransferNftRawTransaction:before-wallet.createTransferNftRawTransaction');
    
    const params = {
      nftAddress: args.nftAddress,
      transferAmount: args.transferAmount,
      transferMessage: args.transferMessage,
    };
    
    const result = await wallet.createTransferNftRawTransaction(params);
    
    emitCallCheckpoint(context, 'createTransferNftRawTransaction:after-wallet.createTransferNftRawTransaction');
    console.log('[walletkitBridge] createTransferNftRawTransaction result:', result);
    
    return result;
  },

  async processInternalBrowserRequest(
    args: { messageId: string; method: string; params?: unknown; from?: string; url?: string; manifestUrl?: string },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'processInternalBrowserRequest:start');
    await ensureWalletKitLoaded();
    requireWalletKit();
    
    console.log('[walletkitBridge] ========== FULL ARGS ==========');
    console.log('[walletkitBridge] args keys:', Object.keys(args));
    console.log('[walletkitBridge] args.from:', args.from);
    console.log('[walletkitBridge] args.url:', args.url);
    console.log('[walletkitBridge] args:', JSON.stringify(args, null, 2));
    console.log('[walletkitBridge] ================================');
    console.log('[walletkitBridge] Processing internal browser request:', args.method, args.messageId);
    
    // Forward all requests to processInjectedBridgeRequest (like the extension does)
    // Deep links are now handled at the Kotlin layer by calling handleTonConnectUrl directly
    if (typeof walletKit.processInjectedBridgeRequest !== 'function') {
      throw new Error('walletKit.processInjectedBridgeRequest is not available');
    }
    
    // Construct message info for the bridge event
    // CRITICAL FIX: Get the domain from the URL passed by Kotlin (the actual dApp WebView URL)
    // The bridge JavaScript runs in a separate WebView for RPC with Android,
    // so we can't access the dApp's window.location directly.
    let actualDomain = 'internal-browser';
    if (args.url) {
      // Kotlin passes the actual dApp URL from the WebView
      try {
        const dappUrl = new URL(args.url);
        actualDomain = dappUrl.hostname;
        console.log('[walletkitBridge] ✅ Domain extracted from dApp URL:', actualDomain);
      } catch (e) {
        console.log('[walletkitBridge] ⚠️ Failed to parse dApp URL, using fallback:', e);
      }
    } else {
      console.log('[walletkitBridge] ⚠️ No dApp URL provided by Kotlin, using fallback');
    }
    
    console.log('[walletkitBridge] Resolved domain for signature:', actualDomain);
    
    const messageInfo = {
      messageId: args.messageId,
      tabId: args.messageId, // Use messageId as tabId for internal browser
      domain: actualDomain, // Use actual dApp domain for signature verification
    };
    
    // Construct the bridge request payload
    // For injected bridge, the 'from' field should be omitted (let wallet generate session ID)
    // This is different from HTTP bridge where dApp provides its session client_id
    
    // CRITICAL: For 'send' method, params should be an ARRAY containing the actual request
    // The dApp sends: { method: 'send', params: [{ method: 'signData', params: [...] }] }
    // BridgeManager.queueJsBridgeEvent extracts params[0] to get the inner request
    
    const finalParams = args.params;
    
    // For 'connect' method, inject manifestUrl if provided by Kotlin and not already in params
    // This ensures the core can fetch manifest data consistently for both HTTP and JS bridges
    if (args.method === 'connect' && args.manifestUrl && finalParams && typeof finalParams === 'object' && !Array.isArray(finalParams)) {
      const paramsObj = finalParams as Record<string, unknown>;
      const hasManifestUrl = paramsObj.manifestUrl || 
                            (paramsObj.manifest && typeof paramsObj.manifest === 'object' && (paramsObj.manifest as Record<string, unknown>).url);
      
      if (!hasManifestUrl) {
        console.log('[walletkitBridge] Injecting manifestUrl into connect params:', args.manifestUrl);
        paramsObj.manifestUrl = args.manifestUrl;
      }
    }
    
    const request: Record<string, unknown> = {
      id: args.messageId,
      method: args.method,
      params: finalParams,
    };
    
    console.log('[walletkitBridge] ========== INJECTED BRIDGE REQUEST ==========');
    console.log('[walletkitBridge] method:', args.method);
    console.log('[walletkitBridge] Omitting from field - wallet will generate session ID');
    console.log('[walletkitBridge] Original params type:', typeof args.params, 'isArray:', Array.isArray(args.params));
    console.log('[walletkitBridge] ==============================================');
    
    console.log('[walletkitBridge] ========== FORWARDING TO processInjectedBridgeRequest ==========');
    console.log('[walletkitBridge] messageInfo:', JSON.stringify(messageInfo, null, 2));
    console.log('[walletkitBridge] request:', JSON.stringify(request, null, 2));
    console.log('[walletkitBridge] request.params type:', typeof request.params);
    console.log('[walletkitBridge] request.params is Array?:', Array.isArray(request.params));
    console.log('[walletkitBridge] ================================================================');
    
    emitCallCheckpoint(context, 'processInternalBrowserRequest:before-processInjectedBridgeRequest');
    
    // Forward to main WalletKit instance - this will queue the event and trigger callbacks
    await walletKit.processInjectedBridgeRequest(messageInfo, request);
    
    emitCallCheckpoint(context, 'processInternalBridgeRequest:after-processInjectedBridgeRequest');
    
    // Wait for the response from jsBridgeTransport before returning
    console.log('[walletkitBridge] ⏳ Response will be provided by jsBridgeTransport');
    
    // Create a promise that will be resolved when jsBridgeTransport is called with the response
    const responsePromise = new Promise<any>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout: ${args.messageId}`));
      }, 60000); // 60 second timeout
      
      // Store resolver in global map
      if (!(globalThis as any).__internalBrowserResponseResolvers) {
        (globalThis as any).__internalBrowserResponseResolvers = new Map();
      }
      (globalThis as any).__internalBrowserResponseResolvers.set(args.messageId, {
        resolve: (response: any) => {
          clearTimeout(timeoutId);
          resolve(response);
        },
        reject: (error: any) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    });
    
    console.log('[walletkitBridge] ⏳ Awaiting response from jsBridgeTransport...');
    const response = await responsePromise;
    console.log('[walletkitBridge] ✅ Received response from jsBridgeTransport:', response);
    console.log('[walletkitBridge] ✅ Response type:', typeof response);
    console.log('[walletkitBridge] ✅ Response keys:', Object.keys(response || {}));
    console.log('[walletkitBridge] ✅ Response.payload:', response?.payload);
    
    // Return the response payload
    const result = response.payload || response;
    console.log('[walletkitBridge] ✅ Returning to Kotlin:', result);
    return result;
  },

  /**
   * Emit browser page started event.
   * Called by TonConnectInjector when a page starts loading.
   */
  emitBrowserPageStarted(args: { url: string }) {
    emit('browserPageStarted', { url: args.url });
    return { success: true };
  },

  /**
   * Emit browser page finished event.
   * Called by TonConnectInjector when a page finishes loading.
   */
  emitBrowserPageFinished(args: { url: string }) {
    emit('browserPageFinished', { url: args.url });
    return { success: true };
  },

  /**
   * Emit browser error event.
   * Called by TonConnectInjector when an error occurs.
   */
  emitBrowserError(args: { message: string }) {
    emit('browserError', { message: args.message });
    return { success: true };
  },

  /**
   * Emit browser bridge request event.
   * Called by TonConnectInjector when a TonConnect request is received.
   * This is for UI tracking only - the request is still processed normally.
   */
  emitBrowserBridgeRequest(args: { messageId: string; method: string; request: string }) {
    emit('browserBridgeRequest', {
      messageId: args.messageId,
      method: args.method,
      request: args.request
    });
    return { success: true };
  },
};

function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const timestamp = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

function normalizeHex(hex: string): string {
  const trimmed = typeof hex === 'string' ? hex.trim() : '';
  if (!trimmed) {
    throw new Error('Empty hex string');
  }
  return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = normalizeHex(hex).slice(2);
  if (normalized.length % 2 !== 0) {
    throw new Error(`Invalid hex string length: ${normalized.length}`);
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '0x';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

window.walletkitBridge = api;

postToNative({
  kind: 'ready',
  network: currentNetwork,
  tonApiUrl: currentApiBase,
});
console.log('[walletkitBridge] bootstrap complete');
