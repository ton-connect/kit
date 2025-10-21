// Module declarations for external dependencies
// Note: These help TypeScript understand modules that don't have type definitions
declare module 'whatwg-url';
declare module 'buffer';

// Bridge event types
export type WalletKitBridgeEvent = {
  type: 'ready'
    | 'connectRequest'
    | 'transactionRequest'
    | 'signDataRequest'
    | 'disconnect'
    | 'signerSignRequest'
    | string;
  data?: any;
};

// Bridge configuration
export type WalletKitBridgeInitConfig = {
  network?: string;
  apiUrl?: string;
  apiBaseUrl?: string;
  tonApiUrl?: string;
  tonClientEndpoint?: string;
  bridgeUrl?: string;
  bridgeName?: string;
  allowMemoryStorage?: boolean;
  walletManifest?: any;
  deviceInfo?: any;
};

// Bridge interfaces
export interface AndroidBridgeType {
  postMessage: (json: string) => void;
}

export interface WalletKitNativeBridgeType {
  postMessage: (json: string) => void;
}

export interface WalletKitBridgeApi {
  init: (config?: WalletKitBridgeInitConfig) => Promise<unknown>;
  addWalletFromMnemonic: (args: { words: string[]; version: 'v5r1' | 'v4r2'; network?: string }) => Promise<unknown>;
  getWallets: () => Promise<unknown>;
  getWalletState: (args: { address: string }) => Promise<unknown>;
  handleTonConnectUrl: (args: { url: string }) => Promise<unknown>;
  sendLocalTransaction: (args: { walletAddress: string; toAddress: string; amount: string; comment?: string }) => Promise<unknown>;
  approveConnectRequest: (args: { requestId: any; walletAddress: string }) => Promise<unknown>;
  rejectConnectRequest: (args: { requestId: any; reason?: string }) => Promise<unknown>;
  approveTransactionRequest: (args: { requestId: any }) => Promise<unknown>;
  rejectTransactionRequest: (args: { requestId: any; reason?: string }) => Promise<unknown>;
  approveSignDataRequest: (args: { requestId: any }) => Promise<unknown>;
  rejectSignDataRequest: (args: { requestId: any; reason?: string }) => Promise<unknown>;
  onEvent: (handler: (event: WalletKitBridgeEvent) => void) => () => void;
}

// Note: Window global augmentations are defined in bridge.ts with more specific types
