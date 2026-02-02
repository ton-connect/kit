/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BridgeResponse, BridgeEvent } from '@ton/walletkit';
import type { WalletKitBridgeEvent } from './events';
import type { WalletKitBridgeApi } from './api';

export type WalletKitApiMethod = keyof WalletKitBridgeApi;

export type DiagnosticStage = 'start' | 'checkpoint' | 'success' | 'error';

/**
 * Union type for all messages passed through jsBridgeTransport from walletkit.
 */
export type JsBridgeTransportMessage = BridgeResponse | BridgeEvent;

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
    | { kind: 'jsBridgeEvent'; sessionId: string; event: JsBridgeTransportMessage };

export interface CallContext {
    id: string;
    method: WalletKitApiMethod;
}
