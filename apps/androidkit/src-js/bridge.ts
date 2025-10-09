import type { WalletKitBridgeEvent, WalletKitBridgeInitConfig } from './types';

const walletKitModulePromise = import('@ton/walletkit');
const tonCoreModulePromise = import('@ton/core');

let TonWalletKit: any;
let createWalletInitConfigMnemonic: any;
let createWalletManifest: any;
let Address: any;
let Cell: any;
let currentNetwork: 'mainnet' | 'testnet' = 'testnet';
let currentApiBase = 'https://testnet.tonapi.io';
type TonChainEnum = { MAINNET: number; TESTNET: number };
let tonConnectChain: TonChainEnum | null = null;

async function ensureWalletKitLoaded() {
  if (TonWalletKit && createWalletInitConfigMnemonic && tonConnectChain && Address && Cell) {
    return;
  }
  if (!TonWalletKit || !createWalletInitConfigMnemonic) {
    const module = await walletKitModulePromise;
    TonWalletKit = (module as any).TonWalletKit;
    createWalletInitConfigMnemonic = (module as any).createWalletInitConfigMnemonic;
    createWalletManifest = (module as any).createWalletManifest ?? createWalletManifest;
    tonConnectChain = (module as { CHAIN?: TonChainEnum }).CHAIN ?? tonConnectChain;
  }
  // Load Address and Cell from @ton/core
  if (!Address || !Cell) {
    const coreModule = await tonCoreModulePromise;
    Address = (coreModule as any).Address;
    Cell = (coreModule as any).Cell;
  }
  if (!tonConnectChain) {
    const module = await walletKitModulePromise;
    tonConnectChain = (module as { CHAIN?: TonChainEnum }).CHAIN ?? null;
    if (!tonConnectChain) {
      throw new Error('TonWalletKit did not expose CHAIN enum');
    }
  }
}

// Helper to convert raw address (0:hex) to user-friendly format (UQ...)
function toUserFriendlyAddress(rawAddress: string | null): string | null {
  if (!rawAddress || !Address) return rawAddress;
  try {
    const addr = Address.parse(rawAddress);
    return addr.toString({ bounceable: false, testOnly: currentNetwork === 'testnet' });
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
    walletkitBridge?: typeof api & {
      onEvent: (handler: (event: WalletKitBridgeEvent) => void) => () => void;
    };
    __walletkitCall?: (id: string, method: WalletKitApiMethod, paramsJson?: string | null) => void;
    WalletKitNative?: { postMessage: (json: string) => void };
    AndroidBridge?: { postMessage: (json: string) => void };
    walletkit_request?: (json: string) => Promise<void>;
  }
}

const listeners = new Set<(event: WalletKitBridgeEvent) => void>();
const legacyRequests = new Set<string>();
const pendingConnectRequests = new Map<string, any>();
const pendingTransactionRequests = new Map<string, any>();
const pendingSignDataRequests = new Map<string, any>();
const activeSessionHints = new Map<string, SessionHint>();

type SessionHint = {
  dAppUrl?: string | null;
  manifestUrl?: string | null;
  iconUrl?: string | null;
};

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
  console.debug('[walletkitBridge] → native', payload);
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
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.error('[walletkitBridge] listener error', err);
    }
  });
  postToNative({ kind: 'event', event });
  if (typeof window.AndroidBridge?.postMessage === 'function') {
    window.AndroidBridge.postMessage(JSON.stringify(event));
  }
}

function respond(id: string, result?: unknown, error?: { message: string }) {
  postToNative({ kind: 'response', id, result, error });
  if (legacyRequests.has(id)) {
    const legacyPayload = JSON.stringify({ id, result, error });
    legacyRequests.delete(id);
    window.AndroidBridge?.postMessage?.(legacyPayload);
  }
}

async function handleCall(id: string, method: WalletKitApiMethod, params?: unknown) {
  emitCallDiagnostic(id, method, 'start');
  try {
    console.log(`[walletkitBridge] handleCall ${method}, looking up api[${method}]`);
    const fn = api[method];
    console.log(`[walletkitBridge] fn found:`, typeof fn, fn ? 'exists' : 'missing');
    if (!fn) throw new Error(`Unknown method ${String(method)}`);
    const context: CallContext = { id, method };
    console.log(`[walletkitBridge] about to call fn for ${method}`);
    const value = await (fn as (args: unknown, context?: CallContext) => Promise<unknown> | unknown)(params as never, context);
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
  const network = config?.network || 'testnet';
  const tonApiUrl = config?.tonApiUrl || config?.apiBaseUrl || (network === 'mainnet' ? 'https://tonapi.io' : 'https://testnet.tonapi.io');
  const clientEndpoint = config?.tonClientEndpoint || config?.apiUrl || (network === 'mainnet' ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC');
  currentNetwork = network;
  currentApiBase = tonApiUrl;
  pendingConnectRequests.clear();
  emitCallCheckpoint(context, 'initTonWalletKit:constructing-tonwalletkit');
  const chains = tonConnectChain;
  if (!chains) {
    throw new Error('TON Connect chain constants unavailable');
  }
  const chain = network === 'mainnet' ? chains.MAINNET : chains.TESTNET;

  let walletManifest = config?.walletManifest;
  if (!walletManifest && config?.bridgeUrl && typeof createWalletManifest === 'function') {
    walletManifest = createWalletManifest({
      bridgeUrl: config.bridgeUrl,
      name: config.bridgeName ?? 'Wallet',
      appName: config.bridgeName ?? 'Wallet',
    });
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

  if (config?.allowMemoryStorage) {
    kitOptions.storage = {
      allowMemory: true,
    };
  }

  walletKit = new TonWalletKit(kitOptions);

  walletKit.onConnectRequest((event: any) => {
    if (event && typeof event === 'object' && event.id != null) {
      pendingConnectRequests.set(event.id, event);
    }
    emit('connectRequest', event);
  });
  walletKit.onTransactionRequest((event: unknown) => {
    const typedEvent = event as any;
    if (typedEvent && typedEvent.id) {
      pendingTransactionRequests.set(typedEvent.id, typedEvent);
    }
    emit('transactionRequest', event);
  });
  walletKit.onSignDataRequest((event: unknown) => {
    const typedEvent = event as any;
    if (typedEvent && typedEvent.id) {
      pendingSignDataRequests.set(typedEvent.id, typedEvent);
    }
    emit('signDataRequest', event);
  });
  walletKit.onDisconnect((event: unknown) => {
    console.log('[walletkitBridge] disconnect event', event);
    emit('disconnect', event);
  });

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
  async init(config?: WalletKitBridgeInitConfig, context?: CallContext) {
    emitCallCheckpoint(context, 'init:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'init:after-ensureWalletKitLoaded');
    emitCallCheckpoint(context, 'init:before-initTonWalletKit');
    const result = await initTonWalletKit(config, context);
    emitCallCheckpoint(context, 'init:after-initTonWalletKit');
    return result;
  },

  async addWalletFromMnemonic(
    args: { words: string[]; version: 'v5r1' | 'v4r2'; network?: 'mainnet' | 'testnet' },
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
    const chain = (args.network || 'testnet') === 'mainnet' ? chains.MAINNET : chains.TESTNET;
    const config = createWalletInitConfigMnemonic({
      mnemonic: args.words,
      version: args.version,
      mnemonicType: 'ton',
      network: chain,
    });
    emitCallCheckpoint(context, 'addWalletFromMnemonic:before-walletKit.addWallet');
    await walletKit.addWallet(config);
    emitCallCheckpoint(context, 'addWalletFromMnemonic:after-walletKit.addWallet');
    return { ok: true };
  },

  async getWallets(_?: unknown, context?: CallContext) {
    emitCallCheckpoint(context, 'getWallets:enter');
    requireWalletKit();
    emitCallCheckpoint(context, 'getWallets:after-requireWalletKit');
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

    for (const key of Array.from(activeSessionHints.keys())) {
      if (typeof key === 'string' && key.startsWith(`${address}::`)) {
        activeSessionHints.delete(key);
      }
    }

    pendingConnectRequests.forEach((event, requestId) => {
      if (event?.walletAddress === address) {
        pendingConnectRequests.delete(requestId);
      }
    });

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

  async sendTransaction(
    args: { walletAddress: string; toAddress: string; amount: string; comment?: string },
    context?: CallContext,
  ) {
    emitCallCheckpoint(context, 'sendTransaction:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'sendTransaction:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'sendTransaction:after-requireWalletKit');

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

    emitCallCheckpoint(context, 'sendTransaction:before-wallet.createTransferTonTransaction');
    const transaction = await wallet.createTransferTonTransaction(transferParams);
    emitCallCheckpoint(context, 'sendTransaction:after-wallet.createTransferTonTransaction');

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
        emitCallCheckpoint(context, 'sendTransaction:before-wallet.getTransactionPreview');
        const previewResult = await wallet.getTransactionPreview(transaction);
        preview = previewResult?.preview ?? previewResult;
        emitCallCheckpoint(context, 'sendTransaction:after-wallet.getTransactionPreview');
      } catch (error) {
        console.warn('[walletkitBridge] getTransactionPreview failed', error);
      }
    }

    // handleNewTransaction triggers onTransactionRequest event
    // Android app should listen to transactionRequest event to show confirmation UI with fee details
    // User then calls approveTransactionRequest or rejectTransactionRequest
    emitCallCheckpoint(context, 'sendTransaction:before-walletKit.handleNewTransaction');
    await walletKit.handleNewTransaction(wallet, transaction);
    emitCallCheckpoint(context, 'sendTransaction:after-walletKit.handleNewTransaction');

    // This returns immediately after queuing the transaction request
    // The actual transaction is sent only when approveTransactionRequest is called
    return {
      success: true,
      transaction,
      preview,
    };
  },

  async approveConnectRequest(args: { requestId: any; walletAddress: string }, context?: CallContext) {
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
    
    const event = pendingConnectRequests.get(args.requestId);
    if (!event) {
      throw new Error('Connect request not found');
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
    if (!result?.success) {
      const message = result?.message || 'Failed to approve connect request';
      throw new Error(message);
    }
    emitCallCheckpoint(context, 'approveConnectRequest:after-walletKit.approveConnectRequest');
    await updateSessionHintsFromWallet(event, wallet);
    pendingConnectRequests.delete(args.requestId);
    return result;
  },

  async rejectConnectRequest(args: { requestId: any; reason?: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'rejectConnectRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'rejectConnectRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'rejectConnectRequest:after-requireWalletKit');
    const event = pendingConnectRequests.get(args.requestId);
    if (!event) {
      throw new Error('Connect request not found');
    }
    pendingConnectRequests.delete(args.requestId);
    const result = await walletKit.rejectConnectRequest(event, args.reason);
    if (!result?.success) {
      const message = result?.message || 'Failed to reject connect request';
      throw new Error(message);
    }
    return result;
  },

  async approveTransactionRequest(args: { requestId: any }, context?: CallContext) {
    emitCallCheckpoint(context, 'approveTransactionRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'approveTransactionRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = pendingTransactionRequests.get(args.requestId);
    if (!event) {
      throw new Error('Transaction request not found');
    }
    const result = await walletKit.approveTransactionRequest(event);
    if (result?.success) {
      pendingTransactionRequests.delete(args.requestId);
    }
    return result;
  },

  async rejectTransactionRequest(args: { requestId: any; reason?: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'rejectTransactionRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'rejectTransactionRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = pendingTransactionRequests.get(args.requestId);
    if (!event) {
      throw new Error('Transaction request not found');
    }
    const result = await walletKit.rejectTransactionRequest(event, args.reason);
    pendingTransactionRequests.delete(args.requestId);
    return result;
  },

  async approveSignDataRequest(args: { requestId: any }, context?: CallContext) {
    emitCallCheckpoint(context, 'approveSignDataRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'approveSignDataRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = pendingSignDataRequests.get(args.requestId);
    if (!event) {
      throw new Error('Sign data request not found');
    }
    console.log('[bridge] Approving sign data request with event:', JSON.stringify(event, null, 2));
    const result = await walletKit.signDataRequest(event);
    console.log('[bridge] Sign data result:', JSON.stringify(result, null, 2));
    if (result?.success) {
      pendingSignDataRequests.delete(args.requestId);
    }
    return result;
  },

  async rejectSignDataRequest(args: { requestId: any; reason?: string }, context?: CallContext) {
    emitCallCheckpoint(context, 'rejectSignDataRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'rejectSignDataRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = pendingSignDataRequests.get(args.requestId);
    if (!event) {
      throw new Error('Sign data request not found');
    }
    const result = await walletKit.rejectSignDataRequest(event, args.reason);
    pendingSignDataRequests.delete(args.requestId);
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
      } catch (error) {
        console.error('[walletkitBridge] walletKit.listSessions failed', error);
        throw error;
      }
      emitCallCheckpoint(context, 'listSessions:after-walletKit.listSessions');
    }
    return sessions.map((session: any) => {
      const sessionId = session.sessionId || session.id;
      const hintKey = sessionId ?? `${session.walletAddress || ''}::${session.dAppName || session.name || ''}`;
      const hint = activeSessionHints.get(hintKey);
      return {
        sessionId,
        dAppName: session.dAppName || session.name || '',
        walletAddress: session.walletAddress,
        dAppUrl: session.dAppUrl || session.url || hint?.dAppUrl || null,
        manifestUrl: session.manifestUrl || hint?.manifestUrl || null,
        iconUrl: session.dAppIconUrl || session.iconUrl || hint?.iconUrl || null,
        createdAt: serializeDate(session.createdAt),
        lastActivity: serializeDate(session.lastActivity),
      };
    });
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
    if (args?.sessionId) {
      activeSessionHints.delete(args.sessionId);
    }
    return { ok: true };
  },

  /**
   * Test/Demo API: Inject a sign data request for testing purposes.
   * This simulates receiving a sign data request from a dApp.
   */
  async injectSignDataRequest(requestData: any, context?: CallContext) {
    emitCallCheckpoint(context, 'injectSignDataRequest:start');
    if (requestData && requestData.id) {
      // Parse the SignDataPayload from params[0]
      let rawPayload: any = null;
      if (requestData.params && Array.isArray(requestData.params) && requestData.params[0]) {
        try {
          rawPayload = typeof requestData.params[0] === 'string' 
            ? JSON.parse(requestData.params[0]) 
            : requestData.params[0];
        } catch (e) {
          console.error('[bridge] Failed to parse signData params[0]:', e);
          return { success: false, error: 'Invalid params' };
        }
      }
      
      if (!rawPayload) {
        console.error('[bridge] No signData payload found in params');
        return { success: false, error: 'No payload' };
      }
      
      // Convert from schema_crc format to TON Connect SignDataPayload format
      let signDataPayload: any;
      if (rawPayload.schema_crc === 0) {
        // Text/comment type
        signDataPayload = { type: 'text', text: rawPayload.payload };
      } else if (rawPayload.schema_crc === 1) {
        // Binary type
        signDataPayload = { type: 'binary', bytes: rawPayload.payload };
      } else if (rawPayload.schema_crc === 2) {
        // Cell type
        const schema =
          typeof rawPayload.schema === 'string'
            ? rawPayload.schema
            : typeof rawPayload.schemaString === 'string'
            ? rawPayload.schemaString
            : undefined;
        if (!schema) {
          console.error('[bridge] Cell payload is missing schema string');
          return { success: false, error: 'Cell payload requires schema string' };
        }
        signDataPayload = { type: 'cell', cell: rawPayload.payload, schema };
      } else {
        // Use payload as-is if already in correct format
        signDataPayload = rawPayload;
      }
      
      // Validate the converted payload
      console.log('[bridge] Validating signDataPayload:', JSON.stringify(signDataPayload));
      if (!signDataPayload || !signDataPayload.type) {
        console.error('[bridge] Invalid signDataPayload - missing type');
        return { success: false, error: 'Invalid payload structure' };
      }
      
      // Create preview based on type
      let preview: any;
      if (signDataPayload.type === 'text') {
        if (!signDataPayload.text) {
          console.error('[bridge] Text payload missing text field');
          return { success: false, error: 'Invalid text payload' };
        }
        preview = { kind: 'text', content: signDataPayload.text };
      } else if (signDataPayload.type === 'binary') {
        if (!signDataPayload.bytes) {
          console.error('[bridge] Binary payload missing bytes field');
          return { success: false, error: 'Invalid binary payload' };
        }
        preview = { kind: 'binary', content: signDataPayload.bytes };
      } else if (signDataPayload.type === 'cell') {
        if (!signDataPayload.cell || !signDataPayload.schema) {
          console.error('[bridge] Cell payload missing cell or schema field');
          return { success: false, error: 'Invalid cell payload - cell and schema required' };
        }
        preview = { kind: 'cell', content: signDataPayload.cell, schema: signDataPayload.schema };
      } else {
        console.error('[bridge] Unknown payload type:', signDataPayload.type);
        return { success: false, error: 'Unknown payload type' };
      }
      
      // Create a proper EventSignDataRequest with request and preview fields
      const processedEvent = {
        ...requestData,
        request: signDataPayload,
        preview: preview,
        isLocal: true,  // Mark as local so bridge response is skipped
      };
      
      console.log('[bridge] Processed injected sign data request:', JSON.stringify(processedEvent, null, 2));
      
      pendingSignDataRequests.set(requestData.id, processedEvent);
      emit('signDataRequest', processedEvent);
    }
    emitCallCheckpoint(context, 'injectSignDataRequest:complete');
    return { success: true };
  },
};

async function updateSessionHintsFromWallet(event: any, wallet: any) {
  if (typeof walletKit.listSessions !== 'function') {
    return;
  }
  const sessions: any[] = (await walletKit.listSessions()) ?? [];
  const walletAddress = wallet.getAddress?.() || wallet.address || event.walletAddress;
  const dAppName = event.dAppName || event.name || '';
  const hintData: SessionHint = {
    dAppUrl: event.dAppUrl || event.url || event?.preview?.manifest?.url || null,
    manifestUrl: event.manifestUrl || event?.preview?.manifest?.url || null,
    iconUrl: event.dAppIconUrl || event.iconUrl || event?.preview?.manifest?.iconUrl || null,
  };

  sessions.forEach((session: any) => {
    const sessionId = session.sessionId || session.id;
    if (!sessionId) {
      return;
    }
    const matchesWallet = walletAddress && session.walletAddress === walletAddress;
    const matchesName = session.dAppName === dAppName || !dAppName;
    if (matchesWallet || matchesName) {
      activeSessionHints.set(sessionId, hintData);
    }
  });
}

function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const timestamp = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

window.walletkitBridge = Object.assign({}, api, {
  onEvent: (handler: (event: WalletKitBridgeEvent) => void) => {
    listeners.add(handler);
    return () => listeners.delete(handler);
  },
});

window.walletkit_request = async (json: string) => {
  try {
    const parsed = JSON.parse(json);
    const { id, method, params } = parsed || {};
    if (!id || !method) throw new Error('Invalid request');
    legacyRequests.add(id);
    await handleCall(id, method as WalletKitApiMethod, params);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    window.AndroidBridge?.postMessage?.(JSON.stringify({ error: { message } }));
  }
};

postToNative({
  kind: 'ready',
  network: currentNetwork,
  tonApiUrl: currentApiBase,
});
console.log('[walletkitBridge] bootstrap complete');
