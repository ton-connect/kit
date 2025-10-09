import { TonWalletKit, CHAIN, createWalletInitConfigMnemonic } from '@ton/walletkit';

declare global {
  interface Window {
    AndroidBridge?: { postMessage: (json: string) => void };
  }
}

type RpcRequest = { id: string; method: string; params?: any };
function respond(id: string, result?: any, error?: { message: string }) {
  const payload = JSON.stringify({ id, result, error });
  if (window.AndroidBridge?.postMessage) {
    window.AndroidBridge.postMessage(payload);
  } else {
    console.log('AndroidBridge missing; payload:', payload);
  }
}

let walletKit: any | null = null;
let initialized = false;

function notify(type: string, data: any) {
  const payload = JSON.stringify({ type, data });
  window.AndroidBridge?.postMessage?.(payload);
}

const api = {
  async init(cfg: any) {
    const network = cfg?.network || 'testnet';
    const apiUrl = cfg?.apiUrl || (network === 'mainnet' ? 'https://tonapi.io' : 'https://testnet.tonapi.io');
    walletKit = new TonWalletKit({
      network: network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET,
      apiClient: { url: apiUrl },
    });
    // Wire events to Android
  // @ts-ignore
  walletKit.onConnectRequest((e) => notify('connectRequest', e));
  // @ts-ignore
  walletKit.onTransactionRequest((e) => notify('transactionRequest', e));
  // @ts-ignore
  walletKit.onSignDataRequest((e) => notify('signDataRequest', e));
  // @ts-ignore
  walletKit.onDisconnect((e) => notify('disconnect', e));
    initialized = true;
    return { ok: true };
  },

  async addWalletFromMnemonic(args: { words: string[]; version: 'v5r1' | 'v4r2'; network?: 'mainnet' | 'testnet' }) {
    if (!walletKit) throw new Error('not initialized');
    const config = createWalletInitConfigMnemonic({
      mnemonic: args.words,
      version: args.version,
      mnemonicType: 'ton',
      network: (args.network || 'testnet') === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET,
    });
    await walletKit.addWallet(config);
    return { ok: true };
  },

  async getWallets() {
    if (!walletKit) throw new Error('not initialized');
  // @ts-ignore runtime mapping only
  const ws = walletKit.getWallets();
    return ws?.map((w: any) => ({
      address: w.getAddress(),
      publicKey: Array.from(w.publicKey as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join(''),
    }));
  },

  async getBalance(args: { address: string }) {
    if (!walletKit) throw new Error('not initialized');
    const w = walletKit.getWallet(args.address);
    if (!w) throw new Error('wallet not found');
    const b = await w.getBalance();
    return { balance: b.toString() };
  },

  async getRecentTransactions(args: { address: string; limit?: number }) {
    if (!walletKit) throw new Error('not initialized');
    const w = walletKit.getWallet(args.address);
    if (!w) throw new Error('wallet not found');
    const txs = await w.getTransactions?.(args.limit || 10);
    return { items: txs || [] };
  },

  async handleTonConnectUrl(args: { url: string }) {
    if (!walletKit) throw new Error('not initialized');
    return walletKit.handleTonConnectUrl(args.url);
  },
  async sendTransaction(args: { walletAddress: string; toAddress: string; amount: string; comment?: string }) {
    if (!walletKit) throw new Error('not initialized');
    const walletAddress =
      typeof args.walletAddress === 'string' ? args.walletAddress.trim() : String(args.walletAddress ?? '').trim();
    if (!walletAddress) throw new Error('wallet address is required');
    const recipient =
      typeof args.toAddress === 'string' ? args.toAddress.trim() : String(args.toAddress ?? '').trim();
    if (!recipient) throw new Error('recipient address is required');
    const amount =
      typeof args.amount === 'string' ? args.amount.trim() : String(args.amount ?? '').trim();
    if (!amount) throw new Error('amount is required');
    const wallet = walletKit.getWallet(walletAddress);
    if (!wallet) throw new Error('wallet not found');
    const params: Record<string, unknown> = { toAddress: recipient, amount };
    const comment = typeof args.comment === 'string' ? args.comment.trim() : '';
    if (comment) {
      params.comment = comment;
    }
    const transaction = await wallet.createTransferTonTransaction(params);
    await walletKit.handleNewTransaction(wallet, transaction);
    return { success: true, transaction };
  },
  async approveConnectRequest(args: { requestId: any; walletAddress: string }) {
    if (!walletKit) throw new Error('not initialized');
    return walletKit.approveConnectRequest(args.requestId);
  },
  async rejectConnectRequest(args: { requestId: any; reason?: string }) {
    if (!walletKit) throw new Error('not initialized');
    return walletKit.rejectConnectRequest(args.requestId, args.reason);
  },
  async approveTransactionRequest(args: { requestId: any }) {
    if (!walletKit) throw new Error('not initialized');
    return walletKit.approveTransactionRequest(args.requestId);
  },
  async rejectTransactionRequest(args: { requestId: any; reason?: string }) {
    if (!walletKit) throw new Error('not initialized');
    return walletKit.rejectTransactionRequest(args.requestId, args.reason);
  },
  async approveSignDataRequest(args: { requestId: any }) {
    if (!walletKit) throw new Error('not initialized');
    return walletKit.signDataRequest(args.requestId);
  },
  async rejectSignDataRequest(args: { requestId: any; reason?: string }) {
    if (!walletKit) throw new Error('not initialized');
    return walletKit.rejectSignDataRequest(args.requestId, args.reason);
  },
};

// Expose request handler for Android
(Object.assign(window, {
  walletkit_request: async (json: string) => {
    try {
      const req: RpcRequest = JSON.parse(json);
      const fn = (api as any)[req.method];
      if (!fn) return respond(req.id, undefined, { message: 'unknown method' });
      const result = await fn(req.params);
      respond(req.id, result);
    } catch (e: any) {
      respond((JSON.parse(json).id) || '0', undefined, { message: e?.message || 'error' });
    }
  },
})) as any;

(async () => {
  // Lazy init listeners after walletKit is created
  // Android will call init; until then we keep a stub
})();
