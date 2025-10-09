import type { WalletKitBridgeEvent, WalletKitBridgeInitConfig } from './types';

declare module '@ton/walletkit' {
  export const TonWalletKit: any;
  export const WalletInitConfigMnemonic: any;
}

declare module 'whatwg-url';
declare module 'buffer';

type WalletKitBridgeApi = {
  init: (config?: WalletKitBridgeInitConfig) => Promise<unknown>;
  addWalletFromMnemonic: (args: { words: string[]; version: 'v5r1' | 'v4r2'; network?: 'mainnet' | 'testnet' }) => Promise<unknown>;
  getWallets: () => Promise<unknown>;
  getWalletState: (args: { address: string }) => Promise<unknown>;
  handleTonConnectUrl: (args: { url: string }) => Promise<unknown>;
  sendTransaction: (args: { walletAddress: string; toAddress: string; amount: string; comment?: string }) => Promise<unknown>;
  approveConnectRequest: (args: { requestId: any; walletAddress: string }) => Promise<unknown>;
  rejectConnectRequest: (args: { requestId: any; reason?: string }) => Promise<unknown>;
  approveTransactionRequest: (args: { requestId: any }) => Promise<unknown>;
  rejectTransactionRequest: (args: { requestId: any; reason?: string }) => Promise<unknown>;
  approveSignDataRequest: (args: { requestId: any }) => Promise<unknown>;
  rejectSignDataRequest: (args: { requestId: any; reason?: string }) => Promise<unknown>;
  onEvent: (handler: (event: WalletKitBridgeEvent) => void) => () => void;
};

interface AndroidBridgeType {
  postMessage: (json: string) => void;
}

interface WalletKitNativeBridgeType {
  postMessage: (json: string) => void;
}

interface Window {
  AndroidBridge?: AndroidBridgeType;
  WalletKitNative?: WalletKitNativeBridgeType;
  walletkitBridge?: WalletKitBridgeApi;
  walletkit_request?: (json: string) => void;
  __walletkitCall?: (id: string, method: string, paramsJson?: string | null) => void;
}
