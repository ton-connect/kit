import type { WalletKitBridgeEvent, WalletKitBridgeInitConfig } from './types';
import { AndroidStorageAdapter } from './AndroidStorageAdapter';

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
// Bridge uses numeric chain ids only: '-239' = mainnet, '-3' = testnet
let currentNetwork: '-239' | '-3' = '-3';
let currentApiBase = 'https://testnet.tonapi.io';
type TonChainEnum = { MAINNET: number; TESTNET: number };
let tonConnectChain: TonChainEnum | null = null;

async function ensureWalletKitLoaded() {
  if (TonWalletKit && createWalletInitConfigMnemonic && tonConnectChain && Address && Cell && Signer && WalletV4R2Adapter && WalletV5R1Adapter) {
    return;
  }
  if (!TonWalletKit || !createWalletInitConfigMnemonic || !Signer || !WalletV4R2Adapter || !WalletV5R1Adapter) {
    const module = await walletKitModulePromise;
    TonWalletKit = (module as any).TonWalletKit;
    createWalletInitConfigMnemonic = (module as any).createWalletInitConfigMnemonic;
  CreateTonMnemonic = (module as any).CreateTonMnemonic ?? (module as any).CreateTonMnemonic;
    createWalletManifest = (module as any).createWalletManifest ?? createWalletManifest;
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
  if (!tonConnectChain) {
    const module = await walletKitModulePromise;
    tonConnectChain = (module as any).CHAIN ?? null;
    if (!tonConnectChain) {
      throw new Error('TonWalletKit did not expose CHAIN enum');
    }
  }
}

// Normalize network input (accept legacy names but bridge stores numeric ids)
function normalizeNetworkValue(n?: string | null): '-239' | '-3' {
  if (!n) return '-3';
  if (n === '-239' || n === '-3') return n as '-239' | '-3';
  if (typeof n === 'string') {
    const lowered = n.toLowerCase();
    if (lowered === 'mainnet') return '-239';
    if (lowered === 'testnet') return '-3';
  }
  // default to testnet
  return '-3';
}

// Helper to convert raw address (0:hex) to user-friendly format (UQ...)
function toUserFriendlyAddress(rawAddress: string | null): string | null {
  if (!rawAddress || !Address) return rawAddress;
  try {
    const addr = Address.parse(rawAddress);
    return addr.toString({ bounceable: false, testOnly: currentNetwork === '-3' });
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
    };

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
  const json = JSON.stringify(payload);
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
  postToNative({ kind: 'response', id, result, error });
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
    emitCallDiagnostic(id, method, 'success');
    respond(id, value);
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
  const tonApiUrl = config?.tonApiUrl || config?.apiBaseUrl || (network === '-239' ? 'https://tonapi.io' : 'https://testnet.tonapi.io');
  const clientEndpoint = config?.tonClientEndpoint || config?.apiUrl || (network === '-239' ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC');
  currentApiBase = tonApiUrl;
  emitCallCheckpoint(context, 'initTonWalletKit:constructing-tonwalletkit');
  const chains = tonConnectChain;
  if (!chains) {
    throw new Error('TON Connect chain constants unavailable');
  }
  const chain = network === '-239' ? chains.MAINNET : chains.TESTNET;

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
  // Normalize network input (accept legacy names but convert to numeric ids)
  const networkValue = normalizeNetworkValue(args.network as string | undefined);
  const chain = networkValue === '-239' ? chains.MAINNET : chains.TESTNET;
    
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
  const chain = networkValue === '-239' ? chains.MAINNET : chains.TESTNET;
    
    // Store pending sign requests
    const pendingSignRequests = new Map<string, { resolve: (sig: Uint8Array) => void; reject: (err: Error) => void }>();
    
    // Create a custom signer that calls back to Android via events
    const customSigner: any = {
      sign: async (bytes: Uint8Array) => {
        // Generate unique request ID
        const requestId = 'sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}';
        
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
      publicKey: args.publicKey,
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
      signature?: number[]; // Array of bytes
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
    } else if (args.signature) {
      pending.resolve(new Uint8Array(args.signature));
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
  const chain = networkValue === '-239' ? chains.MAINNET : chains.TESTNET;
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
  const chain = networkValue === '-239' ? chains.MAINNET : chains.TESTNET;
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
  const chain = networkValue === '-239' ? chains.MAINNET : chains.TESTNET;
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
  const chain = networkValue === '-239' ? chains.MAINNET : chains.TESTNET;
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

  async processInternalBrowserRequest(
    args: { messageId: string; method: string; params?: unknown },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'processInternalBrowserRequest:start');
    await ensureWalletKitLoaded();
    requireWalletKit();
    
    console.log('[walletkitBridge] Processing internal browser request:', args.method, args.messageId);
    
    // Process the request through WalletKit - this will trigger events
    // (connectRequest, transactionRequest, signDataRequest) through the normal flow
    
    switch (args.method) {
      case 'connect':
        // For connect requests, we need to process the connection request
        // The params should contain the TonConnect request data
        console.log('[walletkitBridge] Internal browser connect request:', args.params);
        // TODO: Process connect request and trigger connectRequest event
        emitCallCheckpoint(context, 'processInternalBrowserRequest:connect-handled');
        return { success: true, messageId: args.messageId };
      
      case 'sendTransaction':
        console.log('[walletkitBridge] Internal browser transaction request:', args.params);
        // TODO: Process transaction request and trigger transactionRequest event
        emitCallCheckpoint(context, 'processInternalBrowserRequest:transaction-handled');
        return { success: true, messageId: args.messageId };
      
      case 'signData':
        console.log('[walletkitBridge] Internal browser signData request:', args.params);
        // TODO: Process signData request and trigger signDataRequest event
        emitCallCheckpoint(context, 'processInternalBrowserRequest:signData-handled');
        return { success: true, messageId: args.messageId };
      
      default:
        throw new Error(`Unknown internal browser method: ${args.method}`);
    }
  },
};

function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const timestamp = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

window.walletkitBridge = api;

postToNative({
  kind: 'ready',
  network: currentNetwork,
  tonApiUrl: currentApiBase,
});
console.log('[walletkitBridge] bootstrap complete');
