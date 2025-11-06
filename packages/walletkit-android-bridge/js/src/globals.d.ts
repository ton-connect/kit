// Re-export bridge types for backwards compatibility
import type { 
  WalletKitBridgeEvent, 
  WalletKitBridgeInitConfig,
  AndroidBridgeType,
  WalletKitNativeBridgeType,
  WalletKitBridgeApi,
  WalletKitApiMethod
} from './types';

declare global {
  interface Window {
    walletkitBridge?: WalletKitBridgeApi;
    __walletkitCall?: (id: string, method: WalletKitApiMethod, paramsJson?: string | null) => void;
    WalletKitNative?: WalletKitNativeBridgeType;
    AndroidBridge?: AndroidBridgeType;
  }
}

export {};
