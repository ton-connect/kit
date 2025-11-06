/**
 * Configuration and bridge-facing types for Ton WalletKit.
 */
export interface WalletKitBridgeInitConfig {
  network?: string;
  apiUrl?: string;
  apiBaseUrl?: string;
  tonApiUrl?: string;
  tonClientEndpoint?: string;
  bridgeUrl?: string;
  bridgeName?: string;
  allowMemoryStorage?: boolean;
  walletManifest?: unknown;
  deviceInfo?: unknown;
}

export interface AndroidBridgeType {
  postMessage(json: string): void;
}

export interface WalletKitNativeBridgeType {
  postMessage(json: string): void;
}
