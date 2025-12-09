/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DAppInfo } from "../core/DAppInfo";
import { TransactionEmulatedPreview } from "../transactions/emulation/TransactionEmulatedPreview";
import { TransactionRequest } from "../transactions/TransactionRequest";

/**
 * Event containing a transaction request from a dApp via TON Connect.
 */
export interface TransactionRequestEvent {
  /**
   * Preview information for UI display
   */
  preview: TransactionRequestEventPreview;
  /**
   * Raw transaction request data
   */
  request: TransactionRequest;
}

/**
 * Preview data for displaying transaction request in the wallet UI.
 */
export interface TransactionRequestEventPreview {
  /**
   * Information about the requesting dApp
   */
  dAppInfo?: DAppInfo;
  /**
   * Emulated transaction preview with actions and traces
   */
  data: TransactionEmulatedPreview;
}
