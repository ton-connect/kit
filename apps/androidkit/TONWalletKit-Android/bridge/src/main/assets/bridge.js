const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index2.js","./index.js","./index3.js"])))=>i.map(i=>d[i]);
import { _ as __vitePreload } from "./index.js";
class AndroidStorageAdapter {
  constructor() {
    if (typeof window.Android !== "undefined") {
      this.androidBridge = window.Android;
    } else {
      console.warn("[AndroidStorageAdapter] Android bridge not available, storage will not persist");
    }
  }
  async get(key) {
    if (!this.androidBridge || typeof this.androidBridge.storageGet !== "function") {
      console.warn("[AndroidStorageAdapter] get() called but bridge not available:", key);
      return null;
    }
    try {
      const value = this.androidBridge.storageGet(key);
      console.log("[AndroidStorageAdapter] get:", key, "=", value ? `${value.substring(0, 100)}...` : "null");
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error("[AndroidStorageAdapter] Failed to get key:", key, error);
      return null;
    }
  }
  async set(key, value) {
    if (!this.androidBridge || typeof this.androidBridge.storageSet !== "function") {
      console.warn("[AndroidStorageAdapter] set() called but bridge not available:", key);
      return;
    }
    try {
      const serialized = JSON.stringify(value);
      console.log("[AndroidStorageAdapter] set:", key, "=", serialized.substring(0, 100) + "...");
      this.androidBridge.storageSet(key, serialized);
    } catch (error) {
      console.error("[AndroidStorageAdapter] Failed to set key:", key, error);
    }
  }
  async remove(key) {
    if (!this.androidBridge || typeof this.androidBridge.storageRemove !== "function") {
      return;
    }
    try {
      this.androidBridge.storageRemove(key);
    } catch (error) {
      console.error("[AndroidStorageAdapter] Failed to remove key:", key, error);
    }
  }
  async clear() {
    if (!this.androidBridge || typeof this.androidBridge.storageClear !== "function") {
      return;
    }
    try {
      this.androidBridge.storageClear();
    } catch (error) {
      console.error("[AndroidStorageAdapter] Failed to clear storage:", error);
    }
  }
}
const walletKitModulePromise = __vitePreload(() => import("./index2.js"), true ? __vite__mapDeps([0,1,2]) : void 0, import.meta.url);
const tonCoreModulePromise = __vitePreload(() => import("./index3.js").then((n) => n.i), true ? __vite__mapDeps([2,1]) : void 0, import.meta.url);
let TonWalletKit;
let createWalletInitConfigMnemonic;
let createWalletManifest;
let Address;
let Cell;
let currentNetwork = "testnet";
let currentApiBase = "https://testnet.tonapi.io";
let tonConnectChain = null;
async function ensureWalletKitLoaded() {
  if (TonWalletKit && createWalletInitConfigMnemonic && tonConnectChain && Address && Cell) {
    return;
  }
  if (!TonWalletKit || !createWalletInitConfigMnemonic) {
    const module = await walletKitModulePromise;
    TonWalletKit = module.TonWalletKit;
    createWalletInitConfigMnemonic = module.createWalletInitConfigMnemonic;
    createWalletManifest = module.createWalletManifest ?? createWalletManifest;
    tonConnectChain = module.CHAIN ?? tonConnectChain;
  }
  if (!Address || !Cell) {
    const coreModule = await tonCoreModulePromise;
    Address = coreModule.Address;
    Cell = coreModule.Cell;
  }
  if (!tonConnectChain) {
    const module = await walletKitModulePromise;
    tonConnectChain = module.CHAIN ?? null;
    if (!tonConnectChain) {
      throw new Error("TonWalletKit did not expose CHAIN enum");
    }
  }
}
function toUserFriendlyAddress(rawAddress) {
  if (!rawAddress || !Address) return rawAddress;
  try {
    const addr = Address.parse(rawAddress);
    return addr.toString({ bounceable: false, testOnly: currentNetwork === "testnet" });
  } catch (e) {
    console.warn("[walletkitBridge] Failed to parse address:", rawAddress, e);
    return rawAddress;
  }
}
function base64ToHex(base64) {
  try {
    const binaryString = atob(base64);
    let hex = "";
    for (let i = 0; i < binaryString.length; i++) {
      const hexByte = binaryString.charCodeAt(i).toString(16).padStart(2, "0");
      hex += hexByte;
    }
    return hex;
  } catch (e) {
    console.warn("[walletkitBridge] Failed to convert hash to hex:", base64, e);
    return base64;
  }
}
function extractTextComment(messageBody) {
  if (!messageBody || !Cell) return null;
  try {
    const cell = Cell.fromBase64(messageBody);
    const slice = cell.beginParse();
    const opcode = slice.loadUint(32);
    if (opcode === 0) {
      return slice.loadStringTail();
    }
    return null;
  } catch (e) {
    return null;
  }
}
let walletKit = null;
let initialized = false;
function resolveTonConnectUrl(input) {
  console.log("[walletkitBridge] resolveTonConnectUrl called with input type:", typeof input);
  if (input == null) {
    console.log("[walletkitBridge] input is null/undefined");
    return null;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    console.log("[walletkitBridge] input is string, trimmed:", trimmed.substring(0, 100));
    if (!trimmed) {
      return null;
    }
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return resolveTonConnectUrl(parsed);
      } catch (_error) {
        return null;
      }
    }
    return trimmed;
  }
  if (Array.isArray(input)) {
    console.log("[walletkitBridge] input is array, length:", input.length);
    for (const item of input) {
      const resolved = resolveTonConnectUrl(item);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }
  if (typeof input === "object") {
    console.log("[walletkitBridge] input is object, keys:", Object.keys(input));
    const record = input;
    const candidates = [
      record.url,
      record.href,
      record.link,
      record.location,
      record.requestUrl,
      record.tonconnectUrl,
      record.value
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed) {
          console.log("[walletkitBridge] found candidate URL:", trimmed.substring(0, 100));
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
  console.log("[walletkitBridge] no URL found in input");
  return null;
}
function resolveGlobalScope() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  return {};
}
function resolveNativeBridge(scope) {
  const candidate = scope.WalletKitNative;
  if (candidate && typeof candidate.postMessage === "function") {
    return candidate.postMessage.bind(candidate);
  }
  const windowRef = typeof scope.window === "object" && scope.window ? scope.window : void 0;
  const windowCandidate = windowRef == null ? void 0 : windowRef.WalletKitNative;
  if (windowCandidate && typeof windowCandidate.postMessage === "function") {
    return windowCandidate.postMessage.bind(windowCandidate);
  }
  return null;
}
function resolveAndroidBridge(scope) {
  const candidate = scope.AndroidBridge;
  if (candidate && typeof candidate.postMessage === "function") {
    return candidate.postMessage.bind(candidate);
  }
  const windowRef = typeof scope.window === "object" && scope.window ? scope.window : void 0;
  const windowCandidate = windowRef == null ? void 0 : windowRef.AndroidBridge;
  if (windowCandidate && typeof windowCandidate.postMessage === "function") {
    return windowCandidate.postMessage.bind(windowCandidate);
  }
  return null;
}
function postToNative(payload) {
  if (payload === null || typeof payload !== "object" && typeof payload !== "function") {
    const diagnostic = {
      type: typeof payload,
      value: payload,
      stack: new Error("postToNative non-object payload").stack
    };
    console.error("[walletkitBridge] postToNative received non-object payload", diagnostic);
    throw new Error("Invalid payload - must be an object");
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
  if (payload.kind === "event") {
    throw new Error("Native bridge not available - cannot deliver event");
  }
  console.debug("[walletkitBridge] → native (no handler)", payload);
}
function emitCallDiagnostic(id, method, stage, message) {
  postToNative({
    kind: "diagnostic-call",
    id,
    method,
    stage,
    timestamp: Date.now(),
    message
  });
}
function emitCallCheckpoint(context, message) {
  if (!context) return;
  emitCallDiagnostic(context.id, context.method, "checkpoint", message);
}
function emit(type, data) {
  const event = { type, data };
  postToNative({ kind: "event", event });
}
function respond(id, result, error) {
  postToNative({ kind: "response", id, result, error });
}
async function handleCall(id, method, params) {
  emitCallDiagnostic(id, method, "start");
  try {
    console.log(`[walletkitBridge] handleCall ${method}, looking up api[${method}]`);
    const fn = api[method];
    console.log(`[walletkitBridge] fn found:`, typeof fn);
    if (typeof fn !== "function") throw new Error(`Unknown method ${String(method)}`);
    const context = { id, method };
    console.log(`[walletkitBridge] about to call fn for ${method}`);
    const value = await fn.call(api, params, context);
    console.log(`[walletkitBridge] fn returned for ${method}`);
    emitCallDiagnostic(id, method, "success");
    respond(id, value);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[walletkitBridge] handleCall error for ${method}:`, err);
    console.error(`[walletkitBridge] error type:`, typeof err);
    console.error(`[walletkitBridge] error message:`, message);
    console.error(`[walletkitBridge] error stack:`, err instanceof Error ? err.stack : "no stack");
    emitCallDiagnostic(id, method, "error", message);
    respond(id, void 0, { message });
  }
}
window.__walletkitCall = (id, method, paramsJson) => {
  let params = void 0;
  if (paramsJson && paramsJson !== "null") {
    try {
      params = JSON.parse(paramsJson);
    } catch (err) {
      respond(id, void 0, { message: "Invalid params JSON" });
      return;
    }
  }
  void handleCall(id, method, params);
};
async function initTonWalletKit(config, context) {
  if (initialized && walletKit) {
    emitCallCheckpoint(context, "initTonWalletKit:already-initialized");
    return { ok: true };
  }
  emitCallCheckpoint(context, "initTonWalletKit:begin");
  const network = (config == null ? void 0 : config.network) || "testnet";
  const tonApiUrl = (config == null ? void 0 : config.tonApiUrl) || (config == null ? void 0 : config.apiBaseUrl) || (network === "mainnet" ? "https://tonapi.io" : "https://testnet.tonapi.io");
  const clientEndpoint = (config == null ? void 0 : config.tonClientEndpoint) || (config == null ? void 0 : config.apiUrl) || (network === "mainnet" ? "https://toncenter.com/api/v2/jsonRPC" : "https://testnet.toncenter.com/api/v2/jsonRPC");
  currentNetwork = network;
  currentApiBase = tonApiUrl;
  emitCallCheckpoint(context, "initTonWalletKit:constructing-tonwalletkit");
  const chains = tonConnectChain;
  if (!chains) {
    throw new Error("TON Connect chain constants unavailable");
  }
  const chain = network === "mainnet" ? chains.MAINNET : chains.TESTNET;
  console.log("[walletkitBridge] initTonWalletKit config:", JSON.stringify(config, null, 2));
  let walletManifest = config == null ? void 0 : config.walletManifest;
  console.log("[walletkitBridge] walletManifest from config:", walletManifest);
  if (!walletManifest && (config == null ? void 0 : config.bridgeUrl) && typeof createWalletManifest === "function") {
    console.log("[walletkitBridge] Creating wallet manifest with bridgeName:", config.bridgeName);
    walletManifest = createWalletManifest({
      bridgeUrl: config.bridgeUrl,
      name: config.bridgeName ?? "Wallet",
      appName: config.bridgeName ?? "Wallet"
    });
    console.log("[walletkitBridge] Created wallet manifest:", walletManifest);
  }
  const kitOptions = {
    network: chain,
    apiClient: { url: clientEndpoint }
  };
  if (config == null ? void 0 : config.deviceInfo) {
    kitOptions.deviceInfo = config.deviceInfo;
  }
  if (walletManifest) {
    kitOptions.walletManifest = walletManifest;
  }
  const resolvedBridgeUrl = (config == null ? void 0 : config.bridgeUrl) ?? (walletManifest && typeof walletManifest === "object" ? walletManifest.bridgeUrl : void 0);
  if (resolvedBridgeUrl) {
    kitOptions.bridge = {
      bridgeUrl: resolvedBridgeUrl
    };
  }
  if (typeof window.Android !== "undefined" && typeof window.Android.storageGet === "function") {
    console.log("[walletkitBridge] Using Android native storage adapter");
    kitOptions.storage = new AndroidStorageAdapter();
  } else if (config == null ? void 0 : config.allowMemoryStorage) {
    console.log("[walletkitBridge] Using memory storage (sessions will not persist)");
    kitOptions.storage = {
      allowMemory: true
    };
  }
  walletKit = new TonWalletKit(kitOptions);
  if (typeof walletKit.ensureInitialized === "function") {
    emitCallCheckpoint(context, "initTonWalletKit:before-walletKit.ensureInitialized");
    await walletKit.ensureInitialized();
    emitCallCheckpoint(context, "initTonWalletKit:after-walletKit.ensureInitialized");
  }
  initialized = true;
  emitCallCheckpoint(context, "initTonWalletKit:initialized");
  const readyDetails = {
    network,
    tonApiUrl,
    tonClientEndpoint: clientEndpoint
  };
  emit("ready", readyDetails);
  postToNative({ kind: "ready", ...readyDetails });
  console.log("[walletkitBridge] WalletKit ready");
  emitCallCheckpoint(context, "initTonWalletKit:ready-dispatched");
  return { ok: true };
}
function requireWalletKit() {
  if (!initialized || !walletKit) {
    throw new Error("WalletKit not initialized");
  }
}
const api = {
  // Event listener references stored on the API object, mirroring window.walletKit usage
  onConnectListener: null,
  onTransactionListener: null,
  onSignDataListener: null,
  onDisconnectListener: null,
  async init(config, context) {
    emitCallCheckpoint(context, "init:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "init:after-ensureWalletKitLoaded");
    emitCallCheckpoint(context, "init:before-initTonWalletKit");
    const result = await initTonWalletKit(config, context);
    emitCallCheckpoint(context, "init:after-initTonWalletKit");
    return result;
  },
  setEventsListeners(args, context) {
    requireWalletKit();
    console.log("[walletkitBridge] 🔔 Setting up event listeners");
    const callback = (args == null ? void 0 : args.callback) || ((type, event) => {
      emit(type, event);
    });
    if (this.onConnectListener) {
      walletKit.removeConnectRequestCallback(this.onConnectListener);
    }
    this.onConnectListener = (event) => {
      console.log("[walletkitBridge] 📨 Connect request received");
      callback("connectRequest", event);
    };
    walletKit.onConnectRequest(this.onConnectListener);
    if (this.onTransactionListener) {
      walletKit.removeTransactionRequestCallback(this.onTransactionListener);
    }
    this.onTransactionListener = (event) => {
      console.log("[walletkitBridge] 📨 Transaction request received");
      callback("transactionRequest", event);
    };
    walletKit.onTransactionRequest(this.onTransactionListener);
    if (this.onSignDataListener) {
      walletKit.removeSignDataRequestCallback(this.onSignDataListener);
    }
    this.onSignDataListener = (event) => {
      console.log("[walletkitBridge] 📨 Sign data request received");
      callback("signDataRequest", event);
    };
    walletKit.onSignDataRequest(this.onSignDataListener);
    if (this.onDisconnectListener) {
      walletKit.removeDisconnectCallback(this.onDisconnectListener);
    }
    this.onDisconnectListener = (event) => {
      console.log("[walletkitBridge] 📨 Disconnect event received");
      callback("disconnect", event);
    };
    walletKit.onDisconnect(this.onDisconnectListener);
    console.log("[walletkitBridge] ✅ Event listeners set up successfully");
    return { ok: true };
  },
  removeEventListeners(_, context) {
    requireWalletKit();
    console.log("[walletkitBridge] 🗑️ Removing all event listeners");
    if (this.onConnectListener) {
      walletKit.removeConnectRequestCallback(this.onConnectListener);
      this.onConnectListener = null;
    }
    if (this.onTransactionListener) {
      walletKit.removeTransactionRequestCallback(this.onTransactionListener);
      this.onTransactionListener = null;
    }
    if (this.onSignDataListener) {
      walletKit.removeSignDataRequestCallback(this.onSignDataListener);
      this.onSignDataListener = null;
    }
    if (this.onDisconnectListener) {
      walletKit.removeDisconnectCallback(this.onDisconnectListener);
      this.onDisconnectListener = null;
    }
    console.log("[walletkitBridge] ✅ All event listeners removed");
    return { ok: true };
  },
  async addWalletFromMnemonic(args, context) {
    emitCallCheckpoint(context, "addWalletFromMnemonic:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "addWalletFromMnemonic:after-ensureWalletKitLoaded");
    requireWalletKit();
    emitCallCheckpoint(context, "addWalletFromMnemonic:after-requireWalletKit");
    const chains = tonConnectChain;
    if (!chains) {
      throw new Error("TON Connect chain constants unavailable");
    }
    const networkValue = args.network || "-3";
    const chain = networkValue === "mainnet" || networkValue === "-239" ? chains.MAINNET : chains.TESTNET;
    const config = createWalletInitConfigMnemonic({
      mnemonic: args.words,
      version: args.version,
      mnemonicType: "ton",
      network: chain
    });
    emitCallCheckpoint(context, "addWalletFromMnemonic:before-walletKit.addWallet");
    await walletKit.addWallet(config);
    emitCallCheckpoint(context, "addWalletFromMnemonic:after-walletKit.addWallet");
    return { ok: true };
  },
  async getWallets(_, context) {
    var _a;
    emitCallCheckpoint(context, "getWallets:enter");
    requireWalletKit();
    emitCallCheckpoint(context, "getWallets:after-requireWalletKit");
    if (typeof walletKit.ensureInitialized === "function") {
      emitCallCheckpoint(context, "getWallets:before-walletKit.ensureInitialized");
      await walletKit.ensureInitialized();
      emitCallCheckpoint(context, "getWallets:after-walletKit.ensureInitialized");
    }
    const wallets = ((_a = walletKit.getWallets) == null ? void 0 : _a.call(walletKit)) || [];
    emitCallCheckpoint(context, "getWallets:after-walletKit.getWallets");
    return wallets.map((wallet, index) => ({
      address: wallet.getAddress(),
      publicKey: Array.from(wallet.publicKey).map((b) => b.toString(16).padStart(2, "0")).join(""),
      version: typeof wallet.version === "string" ? wallet.version : "unknown",
      index,
      network: currentNetwork
    }));
  },
  async removeWallet(args, context) {
    var _a, _b;
    emitCallCheckpoint(context, "removeWallet:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "removeWallet:after-ensureWalletKitLoaded");
    requireWalletKit();
    const address = (_a = args.address) == null ? void 0 : _a.trim();
    if (!address) {
      throw new Error("Wallet address is required");
    }
    const wallet = (_b = walletKit.getWallet) == null ? void 0 : _b.call(walletKit, address);
    if (!wallet) {
      return { removed: false };
    }
    emitCallCheckpoint(context, "removeWallet:before-walletKit.removeWallet");
    await walletKit.removeWallet(address);
    emitCallCheckpoint(context, "removeWallet:after-walletKit.removeWallet");
    return { removed: true };
  },
  async getWalletState(args, context) {
    requireWalletKit();
    if (typeof walletKit.ensureInitialized === "function") {
      emitCallCheckpoint(context, "getWalletState:before-walletKit.ensureInitialized");
      await walletKit.ensureInitialized();
      emitCallCheckpoint(context, "getWalletState:after-walletKit.ensureInitialized");
    }
    const wallet = walletKit.getWallet(args.address);
    if (!wallet) throw new Error("Wallet not found");
    emitCallCheckpoint(context, "getWalletState:before-wallet.getBalance");
    const balance = await wallet.getBalance();
    emitCallCheckpoint(context, "getWalletState:after-wallet.getBalance");
    console.log("[walletkitBridge] balance type:", typeof balance);
    console.log("[walletkitBridge] balance value:", balance);
    console.log("[walletkitBridge] balance.toString type:", typeof (balance == null ? void 0 : balance.toString));
    const balanceStr = balance != null && typeof balance.toString === "function" ? balance.toString() : String(balance);
    console.log("[walletkitBridge] balanceStr:", balanceStr);
    const transactions = wallet.getTransactions ? await wallet.getTransactions(10) : [];
    emitCallCheckpoint(context, "getWalletState:after-wallet.getTransactions");
    return { balance: balanceStr, transactions };
  },
  async getRecentTransactions(args, context) {
    var _a, _b, _c, _d;
    emitCallCheckpoint(context, "getRecentTransactions:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "getRecentTransactions:after-ensureWalletKitLoaded");
    requireWalletKit();
    const address = (_a = args.address) == null ? void 0 : _a.trim();
    if (!address) {
      throw new Error("Wallet address is required");
    }
    const wallet = (_b = walletKit.getWallet) == null ? void 0 : _b.call(walletKit, address);
    if (!wallet) {
      throw new Error(`Wallet not found for address ${address}`);
    }
    const limit = Number.isFinite(args.limit) && args.limit > 0 ? Math.floor(args.limit) : 10;
    console.log("[walletkitBridge] getRecentTransactions fetching transactions for address:", address);
    emitCallCheckpoint(context, "getRecentTransactions:before-client.getAccountTransactions");
    const response = await wallet.client.getAccountTransactions({
      address: [address],
      // Must be an array!
      limit
    });
    const transactions = (response == null ? void 0 : response.transactions) || [];
    console.log("[walletkitBridge] getRecentTransactions fetched:", transactions.length, "transactions");
    console.log("[walletkitBridge] Address helper available:", !!Address, "Cell helper available:", !!Cell);
    if (transactions.length > 0) {
      const firstTx = transactions[0];
      console.log("[walletkitBridge] First tx keys:", Object.keys(firstTx).join(", "));
      if (firstTx.in_msg) {
        console.log("[walletkitBridge] in_msg keys:", Object.keys(firstTx.in_msg).join(", "));
        if (firstTx.in_msg.message_content) {
          console.log("[walletkitBridge] in_msg.message_content keys:", Object.keys(firstTx.in_msg.message_content).join(", "));
        }
      }
    }
    const processedTransactions = transactions.map((tx, idx) => {
      var _a2, _b2, _c2, _d2;
      if (tx.hash) {
        tx.hash_hex = base64ToHex(tx.hash);
      }
      if ((_a2 = tx.in_msg) == null ? void 0 : _a2.source) {
        const rawAddr = tx.in_msg.source;
        const friendlyAddr = toUserFriendlyAddress(rawAddr);
        tx.in_msg.source_friendly = friendlyAddr;
        if (idx === 0) {
          console.log("[walletkitBridge] Converting source address:", rawAddr, "→", friendlyAddr);
        }
      }
      if ((_b2 = tx.in_msg) == null ? void 0 : _b2.destination) {
        const rawAddr = tx.in_msg.destination;
        const friendlyAddr = toUserFriendlyAddress(rawAddr);
        tx.in_msg.destination_friendly = friendlyAddr;
        if (idx === 0) {
          console.log("[walletkitBridge] Converting destination address:", rawAddr, "→", friendlyAddr);
        }
      }
      if (tx.out_msgs && Array.isArray(tx.out_msgs)) {
        tx.out_msgs = tx.out_msgs.map((msg) => {
          var _a3;
          const processed = { ...msg };
          if (msg.source) {
            processed.source_friendly = toUserFriendlyAddress(msg.source);
          }
          if (msg.destination) {
            processed.destination_friendly = toUserFriendlyAddress(msg.destination);
          }
          if ((_a3 = msg.message_content) == null ? void 0 : _a3.body) {
            const comment = extractTextComment(msg.message_content.body);
            if (comment) {
              processed.comment = comment;
            }
          }
          return processed;
        });
      }
      if ((_d2 = (_c2 = tx.in_msg) == null ? void 0 : _c2.message_content) == null ? void 0 : _d2.body) {
        const body = tx.in_msg.message_content.body;
        if (idx === 0) {
          console.log("[walletkitBridge] in_msg.message_content.body exists, type:", typeof body, "value:", body ? body.substring(0, 100) : "null");
        }
        const comment = extractTextComment(body);
        if (comment) {
          tx.in_msg.comment = comment;
          if (idx === 0) {
            console.log("[walletkitBridge] Extracted comment from in_msg:", comment);
          }
        } else if (idx === 0) {
          console.log("[walletkitBridge] No comment extracted from body");
        }
      } else if (idx === 0) {
        console.log("[walletkitBridge] No in_msg.message_content.body - keys:", tx.in_msg ? Object.keys(tx.in_msg) : "no in_msg");
      }
      return tx;
    });
    if (processedTransactions.length > 0) {
      console.log("[walletkitBridge] First transaction after processing - hash_hex:", processedTransactions[0].hash_hex);
      console.log("[walletkitBridge] First transaction after processing - in_msg.source_friendly:", (_c = processedTransactions[0].in_msg) == null ? void 0 : _c.source_friendly);
      console.log("[walletkitBridge] First transaction after processing - in_msg.comment:", (_d = processedTransactions[0].in_msg) == null ? void 0 : _d.comment);
    }
    if (processedTransactions.length > 0) {
      console.log("[walletkitBridge] First transaction sample:", JSON.stringify(processedTransactions[0]).substring(0, 800));
    }
    emitCallCheckpoint(context, "getRecentTransactions:after-client.getAccountTransactions");
    return { items: Array.isArray(processedTransactions) ? processedTransactions : [] };
  },
  async handleTonConnectUrl(args, context) {
    console.log("[walletkitBridge] handleTonConnectUrl called with args:", args);
    emitCallCheckpoint(context, "handleTonConnectUrl:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "handleTonConnectUrl:after-ensureWalletKitLoaded");
    requireWalletKit();
    emitCallCheckpoint(context, "handleTonConnectUrl:after-requireWalletKit");
    const url = resolveTonConnectUrl(args);
    console.log("[walletkitBridge] resolved URL:", url);
    if (!url) {
      throw new Error("TON Connect URL is missing");
    }
    console.log("[walletkitBridge] calling walletKit.handleTonConnectUrl with:", url);
    try {
      const result = await walletKit.handleTonConnectUrl(url);
      console.log("[walletkitBridge] handleTonConnectUrl result:", result);
      return result;
    } catch (err) {
      console.error("[walletkitBridge] handleTonConnectUrl error:", err);
      console.error("[walletkitBridge] error type:", typeof err);
      console.error("[walletkitBridge] error message:", err instanceof Error ? err.message : String(err));
      console.error("[walletkitBridge] error stack:", err instanceof Error ? err.stack : "no stack");
      throw err;
    }
  },
  async sendTransaction(args, context) {
    var _a;
    emitCallCheckpoint(context, "sendTransaction:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "sendTransaction:after-ensureWalletKitLoaded");
    requireWalletKit();
    emitCallCheckpoint(context, "sendTransaction:after-requireWalletKit");
    const walletAddress = typeof args.walletAddress === "string" ? args.walletAddress.trim() : String(args.walletAddress ?? "").trim();
    if (!walletAddress) {
      throw new Error("Wallet address is required");
    }
    const toAddress = typeof args.toAddress === "string" ? args.toAddress.trim() : String(args.toAddress ?? "").trim();
    if (!toAddress) {
      throw new Error("Recipient address is required");
    }
    const amount = typeof args.amount === "string" ? args.amount.trim() : String(args.amount ?? "").trim();
    if (!amount) {
      throw new Error("Amount is required");
    }
    const wallet = (_a = walletKit.getWallet) == null ? void 0 : _a.call(walletKit, walletAddress);
    if (!wallet) {
      throw new Error(`Wallet not found for address ${walletAddress}`);
    }
    const transferParams = {
      toAddress,
      amount
    };
    const comment = typeof args.comment === "string" ? args.comment.trim() : "";
    if (comment) {
      transferParams.comment = comment;
    }
    emitCallCheckpoint(context, "sendTransaction:before-wallet.createTransferTonTransaction");
    const transaction = await wallet.createTransferTonTransaction(transferParams);
    emitCallCheckpoint(context, "sendTransaction:after-wallet.createTransferTonTransaction");
    if (comment && transaction.messages && Array.isArray(transaction.messages)) {
      transaction.messages = transaction.messages.map((msg) => ({
        ...msg,
        comment
      }));
    }
    let preview = null;
    if (typeof wallet.getTransactionPreview === "function") {
      try {
        emitCallCheckpoint(context, "sendTransaction:before-wallet.getTransactionPreview");
        const previewResult = await wallet.getTransactionPreview(transaction);
        preview = (previewResult == null ? void 0 : previewResult.preview) ?? previewResult;
        emitCallCheckpoint(context, "sendTransaction:after-wallet.getTransactionPreview");
      } catch (error) {
        console.warn("[walletkitBridge] getTransactionPreview failed", error);
      }
    }
    emitCallCheckpoint(context, "sendTransaction:before-walletKit.handleNewTransaction");
    await walletKit.handleNewTransaction(wallet, transaction);
    emitCallCheckpoint(context, "sendTransaction:after-walletKit.handleNewTransaction");
    return {
      success: true,
      transaction,
      preview
    };
  },
  async approveConnectRequest(args, context) {
    var _a;
    emitCallCheckpoint(context, "approveConnectRequest:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "approveConnectRequest:after-ensureWalletKitLoaded");
    requireWalletKit();
    emitCallCheckpoint(context, "approveConnectRequest:after-requireWalletKit");
    if (typeof walletKit.ensureInitialized === "function") {
      console.log("ensureInitialized");
      emitCallCheckpoint(context, "approveConnectRequest:before-walletKit.ensureInitialized");
      await walletKit.ensureInitialized();
      console.log("await this.initializationPromise");
      emitCallCheckpoint(context, "approveConnectRequest:after-walletKit.ensureInitialized");
      console.log("ensureInitialized done");
    }
    const event = args.event;
    if (!event) {
      throw new Error("Connect request event is required");
    }
    const wallet = (_a = walletKit.getWallet) == null ? void 0 : _a.call(walletKit, args.walletAddress);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    const resolvedAddress = (typeof wallet.getAddress === "function" ? wallet.getAddress() : wallet.address) || args.walletAddress;
    event.wallet = wallet;
    event.walletAddress = resolvedAddress;
    emitCallCheckpoint(context, "approveConnectRequest:before-walletKit.approveConnectRequest");
    const result = await walletKit.approveConnectRequest(event);
    if (!(result == null ? void 0 : result.success)) {
      const message = (result == null ? void 0 : result.message) || "Failed to approve connect request";
      throw new Error(message);
    }
    emitCallCheckpoint(context, "approveConnectRequest:after-walletKit.approveConnectRequest");
    return result;
  },
  async rejectConnectRequest(args, context) {
    emitCallCheckpoint(context, "rejectConnectRequest:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "rejectConnectRequest:after-ensureWalletKitLoaded");
    requireWalletKit();
    emitCallCheckpoint(context, "rejectConnectRequest:after-requireWalletKit");
    const event = args.event;
    if (!event) {
      throw new Error("Connect request event is required");
    }
    const result = await walletKit.rejectConnectRequest(event, args.reason);
    if (!(result == null ? void 0 : result.success)) {
      const message = (result == null ? void 0 : result.message) || "Failed to reject connect request";
      throw new Error(message);
    }
    return result;
  },
  async approveTransactionRequest(args, context) {
    emitCallCheckpoint(context, "approveTransactionRequest:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "approveTransactionRequest:after-ensureWalletKitLoaded");
    requireWalletKit();
    const event = args.event;
    if (!event) {
      throw new Error("Transaction request event is required");
    }
    const result = await walletKit.approveTransactionRequest(event);
    return result;
  },
  async rejectTransactionRequest(args, context) {
    emitCallCheckpoint(context, "rejectTransactionRequest:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "rejectTransactionRequest:after-ensureWalletKitLoaded");
    requireWalletKit();
    const event = args.event;
    if (!event) {
      throw new Error("Transaction request event is required");
    }
    const result = await walletKit.rejectTransactionRequest(event, args.reason);
    return result;
  },
  async approveSignDataRequest(args, context) {
    emitCallCheckpoint(context, "approveSignDataRequest:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "approveSignDataRequest:after-ensureWalletKitLoaded");
    requireWalletKit();
    const event = args.event;
    if (!event) {
      throw new Error("Sign data request event is required");
    }
    console.log("[bridge] Approving sign data request with event:", JSON.stringify(event, null, 2));
    const result = await walletKit.signDataRequest(event);
    console.log("[bridge] Sign data result:", JSON.stringify(result, null, 2));
    return result;
  },
  async rejectSignDataRequest(args, context) {
    emitCallCheckpoint(context, "rejectSignDataRequest:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "rejectSignDataRequest:after-ensureWalletKitLoaded");
    requireWalletKit();
    const event = args.event;
    if (!event) {
      throw new Error("Sign data request event is required");
    }
    const result = await walletKit.rejectSignDataRequest(event, args.reason);
    return result;
  },
  async listSessions(_, context) {
    emitCallCheckpoint(context, "listSessions:enter");
    requireWalletKit();
    let sessions = [];
    if (typeof walletKit.listSessions === "function") {
      emitCallCheckpoint(context, "listSessions:before-walletKit.listSessions");
      try {
        sessions = await walletKit.listSessions() ?? [];
        console.log("[walletkitBridge] listSessions raw result:", sessions);
        console.log("[walletkitBridge] listSessions count:", sessions.length);
      } catch (error) {
        console.error("[walletkitBridge] walletKit.listSessions failed", error);
        throw error;
      }
      emitCallCheckpoint(context, "listSessions:after-walletKit.listSessions");
    } else {
      console.warn("[walletkitBridge] walletKit.listSessions is not a function");
    }
    const items = sessions.map((session) => {
      const sessionId = session.sessionId || session.id;
      const mapped = {
        sessionId,
        dAppName: session.dAppName || session.name || "",
        walletAddress: session.walletAddress,
        dAppUrl: session.dAppUrl || session.url || null,
        manifestUrl: session.manifestUrl || null,
        iconUrl: session.dAppIconUrl || session.iconUrl || null,
        createdAt: serializeDate(session.createdAt),
        lastActivity: serializeDate(session.lastActivity)
      };
      console.log("[walletkitBridge] Mapped session:", JSON.stringify(mapped));
      return mapped;
    });
    console.log("[walletkitBridge] Returning items count:", items.length);
    return { items };
  },
  async disconnectSession(args, context) {
    emitCallCheckpoint(context, "disconnectSession:before-ensureWalletKitLoaded");
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, "disconnectSession:after-ensureWalletKitLoaded");
    requireWalletKit();
    if (typeof walletKit.disconnect !== "function") {
      throw new Error("walletKit.disconnect is not available");
    }
    emitCallCheckpoint(context, "disconnectSession:before-walletKit.disconnect");
    await walletKit.disconnect(args == null ? void 0 : args.sessionId);
    emitCallCheckpoint(context, "disconnectSession:after-walletKit.disconnect");
    return { ok: true };
  }
};
function serializeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const timestamp = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}
window.walletkitBridge = api;
postToNative({
  kind: "ready",
  network: currentNetwork,
  tonApiUrl: currentApiBase
});
console.log("[walletkitBridge] bootstrap complete");
