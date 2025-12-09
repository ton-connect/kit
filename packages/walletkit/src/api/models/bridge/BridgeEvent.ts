/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { UserFriendlyAddress } from "../core/Primitives";

/**
 * Base event type for TON Connect bridge communication.
 */
export interface BridgeEvent {
  /**
   * Unique identifier for the bridge event
   */
  id?: string;

  from?: string;
  /**
   * Wallet address associated with the event
   */
  walletAddress?: UserFriendlyAddress;
  /**
   * Domain of the dApp that initiated the event
   */
  domain?: string;
  /**
   * Whether the event originated from JS Bridge (injected provider)
   */
  isJsBridge?: boolean;
  /**
   * Browser tab ID for JS Bridge events
   */
  tabId?: number;
  /**
   * Session identifier for the connection
   */
  sessionId?: string;
  isLocal?: boolean;
  messageId?: string;
  traceId?: string;
}
