/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress, LogicalTime, Hex } from '../core/Primitives';
import type { TokenAmount } from '../core/TokenAmount';
import type { ExtraCurrencies } from '../core/ExtraCurrencies';
import type { EmulationMessage } from './EmulationMessage';

/**
 * Account status on the TON blockchain.
 */
export type EmulationAccountStatus = 'active' | 'frozen' | 'uninit' | 'nonexist';

/**
 * State of an account at a specific point in an emulated transaction.
 */
export interface EmulationAccountState {
    /**
     * Hex-encoded hash of the account state, if available
     */
    hash?: Hex;

    /**
     * Account balance in nanotons
     */
    balance: TokenAmount;

    /**
     * Extra currencies held by the account, if any
     */
    extraCurrencies?: ExtraCurrencies;

    /**
     * Account status
     */
    accountStatus: EmulationAccountStatus;

    /**
     * Hex-encoded hash of the frozen account state, if frozen
     */
    frozenHash?: Hex;

    /**
     * Hex-encoded hash of the contract data cell
     */
    dataHash?: Hex;

    /**
     * Hex-encoded hash of the contract code cell
     */
    codeHash?: Hex;
}

/**
 * Reference to a block in the TON blockchain.
 */
export interface EmulationBlockRef {
    /**
     * Workchain identifier
     * @format int
     */
    workchain: number;

    /**
     * Shard identifier
     */
    shard: string;

    /**
     * Block sequence number
     * @format int
     */
    seqno: number;
}

/**
 * Storage phase of transaction execution.
 */
export interface EmulationStoragePhase {
    /**
     * Storage fees collected during this phase in nanotons
     */
    storageFeesCollected: TokenAmount;

    /**
     * Account status change applied during the storage phase
     */
    statusChange: string;
}

/**
 * Credit phase of transaction execution.
 */
export interface EmulationCreditPhase {
    /**
     * Amount credited to the account in nanotons
     */
    credit: TokenAmount;
}

/**
 * Compute phase of transaction execution (TVM execution).
 */
export interface EmulationComputePhase {
    /**
     * Whether the compute phase was skipped
     */
    isSkipped: boolean;

    /**
     * Whether the TVM execution succeeded
     */
    isSuccess: boolean;

    /**
     * Whether the message state was used during compute
     */
    isMsgStateUsed: boolean;

    /**
     * Whether the account was activated during compute
     */
    isAccountActivated: boolean;

    /**
     * Gas fees charged in nanotons
     */
    gasFees: TokenAmount;

    /**
     * Total gas consumed
     */
    gasUsed: string;

    /**
     * Gas limit for this execution
     */
    gasLimit: string;

    /**
     * Gas credit, if any
     */
    gasCredit?: string;

    /**
     * Compute execution mode
     * @format int
     */
    mode: number;

    /**
     * TVM exit code
     * @format int
     */
    exitCode: number;

    /**
     * Number of TVM steps executed
     * @format int
     */
    vmSteps: number;

    /**
     * Hex-encoded hash of the initial VM state
     */
    vmInitStateHash?: Hex;

    /**
     * Hex-encoded hash of the final VM state
     */
    vmFinalStateHash?: Hex;
}

/**
 * Total size of messages created in the action phase.
 */
export interface EmulationActionMessageSize {
    /**
     * Number of cells used
     * @format int
     */
    cells: number;

    /**
     * Number of bits used
     * @format int
     */
    bits: number;
}

/**
 * Action phase of transaction execution (outgoing message sending).
 */
export interface EmulationActionPhase {
    /**
     * Whether the action phase succeeded
     */
    isSuccess: boolean;

    /**
     * Whether the action list was valid
     */
    isValid: boolean;

    /**
     * Whether the transaction failed due to insufficient funds
     */
    hasNoFunds: boolean;

    /**
     * Account status change applied during the action phase
     */
    statusChange: string;

    /**
     * Total forwarding fees charged in nanotons
     */
    totalFwdFees?: TokenAmount;

    /**
     * Total action fees charged in nanotons
     */
    totalActionFees?: TokenAmount;

    /**
     * Result code of the action phase
     * @format int
     */
    resultCode: number;

    /**
     * Total number of actions processed
     * @format int
     */
    totalActions: number;

    /**
     * Number of special actions executed
     * @format int
     */
    specActions: number;

    /**
     * Number of actions skipped
     * @format int
     */
    skippedActions: number;

    /**
     * Number of messages created
     * @format int
     */
    msgsCreated: number;

    /**
     * Hex-encoded hash of the action list
     */
    actionListHash?: Hex;

    /**
     * Total size of all messages created
     */
    totalMsgSize: EmulationActionMessageSize;
}

/**
 * Detailed description of all execution phases in an emulated transaction.
 */
export interface EmulationTransactionDescription {
    /**
     * Transaction type (e.g. "ord", "ticktock", "storage")
     */
    type: string;

    /**
     * Whether the transaction was aborted
     */
    isAborted: boolean;

    /**
     * Whether the account was destroyed by this transaction
     */
    isDestroyed: boolean;

    /**
     * Whether the credit phase was executed before the storage phase
     */
    isCreditFirst: boolean;

    /**
     * Whether this was a tock transaction
     */
    isTock: boolean;

    /**
     * Whether a contract was installed in this transaction
     */
    isInstalled: boolean;

    /**
     * Storage phase data
     */
    storagePhase: EmulationStoragePhase;

    /**
     * Credit phase data, present only if credit was processed
     */
    creditPhase?: EmulationCreditPhase;

    /**
     * Compute phase data (TVM execution)
     */
    computePhase: EmulationComputePhase;

    /**
     * Action phase data, present only if actions were executed
     */
    actionPhase?: EmulationActionPhase;
}

/**
 * Transaction within an emulated trace.
 */
export interface EmulationTransaction {
    /**
     * Address of the account that executed this transaction
     */
    account: UserFriendlyAddress;

    /**
     * Hex-encoded transaction hash
     */
    hash: Hex;

    /**
     * Logical time of the transaction
     */
    lt: LogicalTime;

    /**
     * Unix timestamp of the transaction
     * @format timestamp
     */
    now: number;

    /**
     * Masterchain block sequence number
     * @format int
     */
    mcBlockSeqno: number;

    /**
     * Hex-encoded external message hash of the root trace
     */
    traceExternalHash: Hex;

    /**
     * Hex-encoded hash of the previous transaction on this account
     */
    prevTransHash?: Hex;

    /**
     * Logical time of the previous transaction on this account
     */
    prevTransLt?: LogicalTime;

    /**
     * Account status before this transaction was applied
     */
    origStatus: EmulationAccountStatus;

    /**
     * Account status after this transaction was applied
     */
    endStatus: EmulationAccountStatus;

    /**
     * Total fees paid in nanotons
     */
    totalFees: TokenAmount;

    /**
     * Extra currencies paid as fees
     */
    totalFeesExtraCurrencies: ExtraCurrencies;

    /**
     * Detailed breakdown of transaction execution phases
     */
    description: EmulationTransactionDescription;

    /**
     * Block reference where this transaction was included
     */
    blockRef: EmulationBlockRef;

    /**
     * Incoming message that triggered this transaction, or undefined for tick-tock transactions
     */
    inMsg?: EmulationMessage;

    /**
     * Outgoing messages produced by this transaction
     */
    outMsgs: EmulationMessage[];

    /**
     * Account state before the transaction was applied
     */
    accountStateBefore: EmulationAccountState;

    /**
     * Account state after the transaction was applied
     */
    accountStateAfter: EmulationAccountState;

    /**
     * Whether this transaction was produced by emulation rather than executed on-chain
     */
    isEmulated: boolean;

    /**
     * Trace identifier, if available
     */
    traceId?: string;
}
