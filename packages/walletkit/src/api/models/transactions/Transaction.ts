/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Hex, Base64String, LogicalTime, UserFriendlyAddress } from '../core/Primitives';
import { ExtraCurrencies } from '../core/ExtraCurrencies';
import { TokenAmount } from '../core/TokenAmount';

/**
 * Transaction on the TON blockchain.
 */
export interface Transaction {
    /**
     * Account of the transaction
     */
    account: string;

    /**
     * The state of the account before the transaction was executed
     */
    accountStateBefore?: AccountState;

    /**
     * * The state of the account after the transaction has been applied
     */
    accountStateAfter?: AccountState;

    /**
     * The detailed breakdown of the transaction execution
     */
    description?: TransactionDescription;

    /**
     * Hash of the transaction
     */
    hash: Hex;

    /**
     * The logical time of the transaction
     */
    logicalTime: LogicalTime;

    /**
     * Unix timestamp of the transaction
     */
    now: number;

    /**
     * Masterchain block sequence number
     * @format int
     */
    msBlockSeqno: number;

    /**
     * External hash of the trace
     */
    traceExternalHash: Hex;

    /**
     * ID of the trace
     */
    traceId?: string;

    /**
     * The hash of the previous transaction
     */
    previousTransactionHash?: Hex;

    /**
     * The logical time of the previous transaction
     */
    previousTransactionLogicalTime?: LogicalTime;

    /**
     * Original status of the transaction
     */
    origStatus?: AccountStatus;

    /**
     * End status of the transaction
     */
    endStatus?: AccountStatus;

    /**
     * Total fees of the transaction
     */
    totalFees?: TokenAmount;

    /**
     * Extra currencies in the total fees
     */
    totalFeesExtraCurrencies?: ExtraCurrencies;

    /**
     * The reference to the block in which the transaction was included
     */
    blockRef?: TransactionBlockRef;

    /**
     * The incoming message associated with the transaction
     */
    inMessage?: TransactionMessage;

    /**
     * The list of outgoing messages produced by the transaction
     */
    outMessages: TransactionMessage[];

    /**
     * Emulated state of the transaction
     */
    isEmulated: boolean;
}

/**
 * Status of the account on the blockchain.
 */
export type AccountStatus =
    | { type: 'active' }
    | { type: 'frozen' }
    | { type: 'uninit' }
    | { type: 'unknown'; value: string };

/**
 * State of an account at a specific point in time.
 */
export interface AccountState {
    /**
     * The state hash of the account
     */
    hash: Hex;

    /**
     * The account's balance in nanotons
     */
    balance: TokenAmount;

    /**
     * The additional currencies held by the account, if any
     */
    extraCurrencies?: ExtraCurrencies;

    /**
     * The status of the account
     */
    accountStatus: AccountStatus;

    /**
     * The hash of the frozen account state, if the account is frozen
     */
    frozenHash?: Hex;

    /**
     * The hash of the contract's data section
     */
    dataHash?: Hex;

    /**
     * The hash of the smart contract code
     */
    codeHash?: Hex;
}

/**
 * Reference to a block in the TON blockchain.
 */
export interface TransactionBlockRef {
    /**
     * The workchain ID of the block
     * @format int
     */
    workchain: number;

    /**
     * The shard identifier of the block
     */
    shard: string;

    /**
     * The sequence number of the block
     * @format uint
     */
    seqno: number;
}

/**
 * Message sent or received in a transaction.
 */
export interface TransactionMessage {
    /**
     * The base64-encoded hash of the message
     */
    hash: Hex;

    /**
     * The normalized version of the message hash
     */
    normalizedHash?: Hex;

    /**
     * The source address of the message
     */
    source?: UserFriendlyAddress;

    /**
     * The destination address of the message
     */
    destination?: UserFriendlyAddress;

    /**
     * The amount of nanos transferred with the message
     */
    value?: TokenAmount;

    /**
     * The additional currencies included in the message
     */
    valueExtraCurrencies?: ExtraCurrencies;

    /**
     * The forwarding fee for the message
     */
    fwdFee?: TokenAmount;

    /**
     * The logical time when the message was created
     */
    creationLogicalTime?: LogicalTime;

    /**
     * The timestamp when the message was created
     */
    createdAt?: number;

    /**
     * The opcode included in the message payload
     * @format int
     */
    opcode?: number;

    /**
     * IHR(Immediate hypercube routing) enabled/disabled
     * IHR is a method of message delivery in the TON Blockchain network, where messages are sent directly to the recipient’s shardchain.
     */
    ihrDisabled?: boolean;

    /**
     * The fee for IHR delivery
     */
    ihrFee?: TokenAmount;

    /**
     * The flag indicating if the message requested a bounce on failure
     */
    isBounce?: boolean;

    /**
     * The flag indicating if the message was bounced back
     */
    isBounced?: boolean;

    /**
     * Import fee for the message (NanoTONs amount)
     */
    importFee?: TokenAmount;

    /**
     * The content body of the message
     */
    messageContent?: TransactionMessageContent;

    /**
     * The initial state of the contract, if provided by the message
     */
    initState?: TransactionMessageContent;
}

/**
 * Content of a transaction message (body or init state).
 */
export interface TransactionMessageContent {
    /**
     * The hash of the initial state
     */
    hash: string;

    /**
     * The body in BOC format
     */
    body: Base64String;

    /**
     * The decoded metadata from the initial state body
     */
    decoded?: unknown;
}

/**
 * Detailed description of transaction execution phases.
 */
export interface TransactionDescription {
    /**
     * The transaction type (e.g., tick-tock, ord, split-prepare)
     */
    type: string;

    /**
     * The flag indicating if the transaction was aborted
     */
    isAborted: boolean;

    /**
     * The flag indicating if the account was destroyed
     */
    isDestroyed: boolean;

    /**
     * The flag indicating if the credit phase was executed first
     */
    isCreditFirst: boolean;

    /**
     * The flag indicating if this was a tock transaction
     */
    isTock: boolean;

    /**
     * The flag indicating if the contract was installed
     */
    isInstalled: boolean;

    /**
     * The storage phase data of the transaction
     */
    storagePhase?: TransactionStoragePhase;

    /**
     * The credit phase of the transaction
     */
    creditPhase?: TransactionCreditPhase;

    /**
     * The compute phase data of the transaction
     */
    computePhase?: TransactionComputePhase;

    /**
     * The action phase data of the transaction
     */
    action?: TransactionAction;
}

/**
 * Storage phase of transaction execution.
 */
export interface TransactionStoragePhase {
    /**
     * The storage fees collected during this phase
     */
    storageFeesCollected: TokenAmount;

    /**
     * The status change applied to the account during the storage phase
     */
    statusChange?: string;
}

/**
 * Credit phase of transaction execution.
 */
export interface TransactionCreditPhase {
    /**
     * The credited amount
     */
    credit: TokenAmount;
}

/**
 * Compute phase of transaction execution (TVM execution).
 */
export interface TransactionComputePhase {
    /**
     * The flag indicating if the compute phase was skipped
     */
    isSkipped: boolean;

    /**
     * The success state of the compute phase
     */
    isSuccess: boolean;

    /**
     * The flag indicating if message state was used
     */
    isMessageStateUsed: boolean;

    /**
     * The flag indicating if the account was activated during compute
     */
    isAccountActivated: boolean;

    /**
     * The gas fees charged for compute
     */
    gasFees: TokenAmount;

    /**
     * The total gas used in the compute phase
     */
    gasUsed: TokenAmount;

    /**
     * The gas limit for the compute phase
     */
    gasLimit: TokenAmount;

    /**
     * The gas credit for the compute phase
     */
    gasCredit?: TokenAmount;

    /**
     * The compute execution mode
     * @format int
     */
    mode: number;

    /**
     * The exit code returned from the VM
     * @format int
     */
    exitCode: number;

    /**
     * The number of steps executed by the VM
     * @format int
     */
    vmStepsNumber: number;

    /**
     * The hash of the initial VM state before compute
     */
    vmInitStateHash: string;

    /**
     * The hash of the final VM state after compute
     */
    vmFinalStateHash: string;
}

/**
 * Action phase of transaction execution (message sending).
 */
export interface TransactionAction {
    /**
     * The flag indicating whether the action phase succeeded
     */
    isSuccess: boolean;

    /**
     * The flag indicating whether the action phase was valid
     */
    isValid: boolean;

    /**
     * The flag indicating if the transaction had insufficient funds
     */
    hasNoFunds: boolean;

    /**
     * The status change applied to the account during the action phase
     */
    statusChange: string;

    /**
     * The total forwarding fees charged
     */
    totalForwardingFees?: TokenAmount;

    /**
     * The total fees charged for actions
     */
    totalActionFees?: TokenAmount;

    /**
     * The result code returned from the action phase
     * @format int
     */
    resultCode: number;

    /**
     * The total number of actions processed
     * @format int
     */
    totalActionsNumber: number;

    /**
     * The number of special actions executed
     * @format int
     */
    specActionsNumber: number;

    /**
     * The number of skipped actions during execution
     * @format int
     */
    skippedActionsNumber: number;

    /**
     * The number of messages created in the action phase
     * @format int
     */
    messagesCreatedCount: number;

    /**
     * The hash of the action list
     */
    actionListHash: string;

    /**
     * The total size of messages created in the action phase
     */
    totalMessagesSize?: TransactionActionMessageSize;
}

/**
 * Size metrics for messages created in a transaction.
 */
export interface TransactionActionMessageSize {
    /**
     * The total number of cells used
     */
    cells: string;

    /**
     * The total number of bits used
     */
    bits: string;
}
