/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { UserFriendlyAddress, Hex, LogicalTime } from "../core/Primitives";
import { ExtraCurrencies } from "../core/ExtraCurrencies";
import { TokenAmount } from "../core/TokenAmount";
import { Transaction } from "./Transaction";

/**
 * Trace of a transaction execution showing the full message chain.
 */
export interface TransactionTrace {
  /**
   * Masterchain block sequence number where emulation was performed
   * @format int
   */
  mcBlockSeqno: number;

  /**
   * Root trace node of the execution tree
   */
  trace: TransactionTraceNode;

  /**
   * Map of transaction hashes to transaction details
   */
  transactions: { [key: Hex]: Transaction };

  /**
   * List of high-level actions extracted from the trace
   */
  actions: TransactionTraceAction[];

  /**
   * Random seed used for emulation
   */
  randSeed: Hex;

  /**
   * Whether the trace is incomplete due to limits or errors
   */
  isIncomplete: boolean;
}

/**
 * Node in the transaction execution tree.
 */
export interface TransactionTraceNode {
  /**
   * Transaction hash
   */
  txHash?: Hex;

  /**
   * Incoming message hash
   */
  inMsgHash?: Hex;

  /**
   * Child trace nodes representing spawned messages
   */
  children: TransactionTraceNode[];
}

/**
 * High-level action extracted from a transaction trace.
 */
export interface TransactionTraceAction {
  /**
   * Trace identifier
   */
  traceId?: string;

  /**
   * Action identifier
   */
  actionId: string;

  /**
   * Logical time when the action started
   */
  startLt: LogicalTime;
  /**
   * Logical time when the action ended
   */
  endLt: LogicalTime;
  /**
   * Unix time when the action started
   */
  startUtime: number;
  /**
   * Unix time when the action ended
   */
  endUtime: number;
  /**
   * Logical time when the trace ended
   */
  traceEndLt: LogicalTime;
  /**
   * Unix time when the trace ended
   */
  traceEndUtime: number;
  /**
   * Masterchain block sequence number when the trace ended
   */
  traceMcSeqnoEnd: number;
  /**
   * List of transaction hashes involved in this action
   */
  transactions: Hex[];
  /**
   * Indicates if the action was successful
   */
  isSuccess: boolean;
  /**
   * External hash of the trace
   */
  traceExternalHash: Hex;
  /**
   * List of accounts involved in this action
   */
  accounts: UserFriendlyAddress[];
  /**
   * Detailed information about the action
   */
  details: TransactionTraceActionDetails;
}

/**
 * Details of a transaction trace action
 */
export type TransactionTraceActionDetails =
  | { type: "jetton_swap"; value: TransactionTraceActionJettonSwapDetails }
  | { type: "call_contract"; value: TransactionTraceActionCallContractDetails }
  | { type: "ton_transfer"; value: TransactionTraceActionTonTransferDetails }
  | { type: "unknown"; value: { [key: string]: unknown } };

/**
 * Details of a Jetton swap action on a DEX.
 */
export interface TransactionTraceActionJettonSwapDetails {
  /**
   * Name of the decentralized exchange
   */
  dex: string;

  /**
   * Address of the account initiating the swap
   */
  sender: UserFriendlyAddress;

  /**
   * Transfer details for tokens sent to the DEX
   */
  dexIncomingTransfer?: TransactionTraceActionJettonTransfer;

  /**
   * Transfer details for tokens received from the DEX
   */
  dexOutgoingTransfer?: TransactionTraceActionJettonTransfer;

  /**
   * Related peer swap operations (for multi-hop swaps)
   */
  peerSwaps: unknown[];
}

export interface TransactionTraceActionJettonTransfer {
  /**
   * Jetton asset address being transferred.
   */
  asset: UserFriendlyAddress;

  /**
   * Address of the sender account.
   */
  source: UserFriendlyAddress;

  /**
   * Address of the receiver account.
   */
  destination: UserFriendlyAddress;

  /**
   * Jetton wallet address of the sender.
   */
  sourceJettonWallet?: UserFriendlyAddress;

  /**
   * Jetton wallet address of the receiver.
   */
  destinationJettonWallet?: UserFriendlyAddress;

  /**
   * Amount of jettons transferred.
   */
  amount: TokenAmount;
}

export interface TransactionTraceActionCallContractDetails {
  /**
   * Opcode or method identifier of the contract call.
   */
  opcode: string;

  /**
   * Address of the sender account.
   */
  source: UserFriendlyAddress;

  /**
   * Address of the receiver account.
   */
  destination: UserFriendlyAddress;

  /**
   * Value transferred during the contract call.
   */
  value: TokenAmount;

  /**
   * Extra currencies sent with the call.
   */
  valueExtraCurrencies?: ExtraCurrencies;
}

export interface TransactionTraceActionTonTransferDetails {
  /**
   * Address of the sender account.
   */
  source: UserFriendlyAddress;

  /**
   * Address of the receiver account.
   */
  destination: UserFriendlyAddress;

  /**
   * Amount of TON transferred (in nanotons).
   */
  value: TokenAmount;

  /**
   * Extra currencies sent with the transfer.
   */
  valueExtraCurrencies?: ExtraCurrencies;

  /**
   * Optional comment for the transfer
   */
  comment?: string;

  /**
   * Indicates if the payload or comment was encrypted.
   */
  isEncrypted: boolean;
}
