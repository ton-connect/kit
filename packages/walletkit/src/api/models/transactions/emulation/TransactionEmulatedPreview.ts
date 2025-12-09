/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ResultError, Result } from "../../core/Primitives";
import { TransactionEmulatedTrace } from "./TransactionEmulatedTrace";
import { TransactionMoneyFlow } from "../TransactionMoneyFlow";

/**
 * Preview of an emulated transaction showing expected outcome.
 */
export interface TransactionEmulatedPreview {
  /**
   * Result status of the emulation (success or failure)
   */
  result: Result;

  /**
   * Error details if the emulation failed
   */
  error?: ResultError;

  /**
   * Full execution trace if emulation succeeded
   */
  trace?: TransactionEmulatedTrace;

  /**
   * Summary of token flows (incoming/outgoing) for the transaction
   */
  moneyFlow?: TransactionMoneyFlow;
}
