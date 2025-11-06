import type { WalletKitBridgeEvent } from './events';
import type { WalletKitBridgeApi } from './api';

export interface TonChainEnum {
  MAINNET: number;
  TESTNET: number;
}

export type WalletKitApiMethod = keyof WalletKitBridgeApi;

export type DiagnosticStage = 'start' | 'checkpoint' | 'success' | 'error';

export type BridgePayload =
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
      stage: DiagnosticStage;
      timestamp: number;
      message?: string;
    }
  | { kind: 'jsBridgeEvent'; sessionId: string; event: unknown };

export interface CallContext {
  id: string;
  method: WalletKitApiMethod;
}
