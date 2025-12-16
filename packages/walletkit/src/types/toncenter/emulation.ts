/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Base64ToHex } from '../..';
import type {
    AccountState,
    AccountStatus,
    Transaction,
    TransactionMessage,
    TransactionDescription,
    TransactionBlockRef,
    TransactionTraceNode,
    TransactionTraceAction,
    TransactionTraceActionDetails,
    TransactionTraceActionJettonSwapDetails,
    TransactionTraceActionCallContractDetails,
    TransactionTraceActionTONTransferDetails,
    TransactionEmulatedTrace,
    TransactionsResponse,
    UserFriendlyAddress,
} from '../../api/models';
import { asAddressFriendly, asMaybeAddressFriendly } from '../primitive';
import type { AddressBookRowV3, MetadataV3 } from './v3/AddressBookRowV3';
import { toAddressBook } from './v3/AddressBookRowV3';
// Types for Toncenter emulation endpoint response

// Root response
export interface ToncenterEmulationResponse extends MetadataV3 {
    mc_block_seqno: number;
    trace: EmulationTraceNode;
    transactions: Record<string, ToncenterTransaction>;
    actions: EmulationAction[];
    code_cells: Record<string, string>; // base64-encoded cells by code hash
    data_cells: Record<string, string>; // base64-encoded cells by data hash
    rand_seed: string;
    is_incomplete: boolean;
}

export function toTransactionEmulatedTrace(response: ToncenterEmulationResponse): TransactionEmulatedTrace {
    return {
        mcBlockSeqno: response.mc_block_seqno,
        trace: toTransactionTraceNode(response.trace),
        transactions: Object.fromEntries(
            Object.entries(response.transactions ?? {}).map(([hash, tx]) => [Base64ToHex(hash), toTransaction(tx)]),
        ),
        actions: response.actions.map(toTransactionTraceAction),
        randSeed: Base64ToHex(response.rand_seed),
        isIncomplete: response.is_incomplete,
        codeCells: Object.fromEntries(
            Object.entries(response.code_cells ?? {}).map(([hash, cell]) => [Base64ToHex(hash), cell]),
        ),
        dataCells: Object.fromEntries(
            Object.entries(response.data_cells ?? {}).map(([hash, cell]) => [Base64ToHex(hash), cell]),
        ),
        metadata: {}, // to be filled later
        addressBook: {}, // to be filled later
    };
}

function toTransactionTraceNode(node: EmulationTraceNode): TransactionTraceNode {
    return {
        txHash: node.tx_hash ? Base64ToHex(node.tx_hash) : undefined,
        inMsgHash: node.in_msg_hash ? Base64ToHex(node.in_msg_hash) : undefined,
        children: node.children?.map(toTransactionTraceNode) ?? [],
    };
}

export interface ToncenterTracesResponse extends MetadataV3 {
    traces: ToncenterTraceItem[];
}

export interface ToncenterTransactionsResponse {
    transactions: ToncenterTransaction[];
    address_book: Record<string, AddressBookRowV3>;
}

export function toTransactionsResponse(response: ToncenterTransactionsResponse): TransactionsResponse {
    return {
        transactions: response.transactions?.map(toTransaction) ?? [],
        addressBook: toAddressBook(response.address_book),
    };
}

export interface ToncenterTraceItem {
    actions?: EmulationAction[];
    end_lt: string;
    end_utime: number;
    external_hash: string;
    is_incomplete: boolean;
    mc_seqno_end: string;
    mc_seqno_start: string;
    start_lt: string;
    start_utime: number;
    trace: EmulationTraceNode;
    trace_id: string;
    trace_info: TraceMeta;
    transactions: Record<string, ToncenterTransaction>;
    transactions_order: string[];
    warning: string;
}

export interface TraceMeta {
    classification_state: string;
    messages: number;
    pending_messages: number;
    trace_state: string;
    transactions: number;
}

// Trace tree
export interface EmulationTraceNode {
    tx_hash: string;
    in_msg_hash: string | null;
    children: EmulationTraceNode[];
}

// Transactions map value (for emulation endpoint)
export interface ToncenterTransaction {
    account: string;
    hash: string;
    lt: string;
    now: number;
    mc_block_seqno: number;
    trace_external_hash: string;
    prev_trans_hash: string | null;
    prev_trans_lt: string | null;
    orig_status: EmulationAccountStatus | string;
    end_status: EmulationAccountStatus | string;
    total_fees: string;
    total_fees_extra_currencies: Record<string, string>;
    description: EmulationTransactionDescription;
    block_ref: EmulationBlockRef;
    in_msg: EmulationMessage | null;
    out_msgs: EmulationMessage[];
    account_state_before: EmulationAccountState;
    account_state_after: EmulationAccountState;
    emulated: boolean;
    trace_id?: string;
}

function toTransaction(tx: ToncenterTransaction): Transaction {
    return {
        account: asAddressFriendly(tx.account),
        accountStateBefore: toAccountState(tx.account_state_before),
        accountStateAfter: toAccountState(tx.account_state_after),
        description: toTransactionDescription(tx.description),
        hash: Base64ToHex(tx.hash),
        logicalTime: tx.lt,
        now: tx.now,
        mcBlockSeqno: tx.mc_block_seqno,
        traceExternalHash: Base64ToHex(tx.trace_external_hash),
        traceId: tx.trace_id ?? undefined,
        previousTransactionHash: tx.prev_trans_hash ? Base64ToHex(tx.prev_trans_hash) : undefined,
        previousTransactionLogicalTime: tx.prev_trans_lt ?? undefined,
        origStatus: toAccountStatus(tx.orig_status),
        endStatus: toAccountStatus(tx.end_status),
        totalFees: tx.total_fees,
        totalFeesExtraCurrencies: tx.total_fees_extra_currencies,
        blockRef: toTransactionBlockRef(tx.block_ref),
        inMessage: tx.in_msg ? toTransactionMessage(tx.in_msg) : undefined,
        outMessages: tx.out_msgs?.map(toTransactionMessage) ?? [],
        isEmulated: tx.emulated,
    };
}

export type EmulationAccountStatus = 'active' | 'frozen' | 'uninit';

function toAccountStatus(status: EmulationAccountStatus | string): AccountStatus {
    if (status === 'active') {
        return { type: 'active' };
    } else if (status === 'frozen') {
        return { type: 'frozen' };
    } else if (status === 'uninit') {
        return { type: 'uninit' };
    } else {
        return { type: 'unknown', value: status };
    }
}
export interface EmulationBlockRef {
    workchain: number;
    shard: string;
    seqno: number;
}

function toTransactionBlockRef(ref: EmulationBlockRef): TransactionBlockRef {
    return {
        workchain: ref.workchain,
        shard: ref.shard,
        seqno: ref.seqno,
    };
}

export interface EmulationTransactionDescription {
    type: string; // e.g. "ord"
    aborted: boolean;
    destroyed: boolean;
    credit_first: boolean;
    is_tock: boolean;
    installed: boolean;
    storage_ph: {
        storage_fees_collected: string;
        status_change: 'unchanged' | string;
    };
    credit_ph?: {
        credit: string;
    };
    compute_ph: {
        skipped: boolean;
        success: boolean;
        msg_state_used: boolean;
        account_activated: boolean;
        gas_fees: string;
        gas_used: string;
        gas_limit: string;
        gas_credit?: string;
        mode: number;
        exit_code: number;
        vm_steps: number;
        vm_init_state_hash: string;
        vm_final_state_hash: string;
    };
    action: {
        success: boolean;
        valid: boolean;
        no_funds: boolean;
        status_change: 'unchanged' | string;
        total_fwd_fees?: string;
        total_action_fees?: string;
        result_code: number;
        tot_actions: number;
        spec_actions: number;
        skipped_actions: number;
        msgs_created: number;
        action_list_hash: string;
        tot_msg_size: {
            cells: string;
            bits: string;
        };
    };
}

function toTransactionDescription(desc: EmulationTransactionDescription): TransactionDescription {
    return {
        type: desc.type,
        isAborted: desc.aborted,
        isDestroyed: desc.destroyed,
        isCreditFirst: desc.credit_first,
        isTock: desc.is_tock,
        isInstalled: desc.installed,
        storagePhase: {
            storageFeesCollected: desc.storage_ph?.storage_fees_collected,
            statusChange: desc.storage_ph?.status_change,
        },
        creditPhase: desc.credit_ph
            ? {
                  credit: desc.credit_ph?.credit,
              }
            : undefined,
        computePhase: {
            isSkipped: desc.compute_ph?.skipped,
            isSuccess: desc.compute_ph?.success,
            isMessageStateUsed: desc.compute_ph?.msg_state_used,
            isAccountActivated: desc.compute_ph?.account_activated,
            gasFees: desc.compute_ph?.gas_fees,
            gasUsed: desc.compute_ph?.gas_used,
            gasLimit: desc.compute_ph?.gas_limit,
            gasCredit: desc.compute_ph?.gas_credit,
            mode: desc.compute_ph?.mode,
            exitCode: desc.compute_ph?.exit_code,
            vmStepsNumber: desc.compute_ph?.vm_steps,
            vmInitStateHash: desc.compute_ph?.vm_init_state_hash
                ? Base64ToHex(desc.compute_ph.vm_init_state_hash)
                : undefined,
            vmFinalStateHash: desc.compute_ph?.vm_final_state_hash
                ? Base64ToHex(desc.compute_ph.vm_final_state_hash)
                : undefined,
        },
        action: {
            isSuccess: desc.action?.success,
            isValid: desc.action?.valid,
            hasNoFunds: desc.action?.no_funds,
            statusChange: desc.action?.status_change,
            totalForwardingFees: desc.action?.total_fwd_fees,
            totalActionFees: desc.action?.total_action_fees,
            resultCode: desc.action?.result_code,
            totalActionsNumber: desc.action?.tot_actions,
            specActionsNumber: desc.action?.spec_actions,
            skippedActionsNumber: desc.action?.skipped_actions,
            messagesCreatedNumber: desc.action?.msgs_created,
            actionListHash: desc.action?.action_list_hash ? Base64ToHex(desc.action.action_list_hash) : undefined,
            totalMessagesSize: {
                cells: desc.action?.tot_msg_size.cells,
                bits: desc.action?.tot_msg_size.bits,
            },
        },
    };
}

export interface EmulationMessage {
    hash: string;
    source: string | null;
    destination: string;
    value: string | null;
    value_extra_currencies: Record<string, string>;
    fwd_fee: string | null;
    ihr_fee: string | null;
    created_lt: string | null;
    created_at: string | null;
    opcode: string | null;
    ihr_disabled: boolean | null;
    bounce: boolean | null;
    bounced: boolean | null;
    import_fee: string | null;
    message_content: {
        hash: string;
        body: string; // base64-encoded body
        decoded: unknown | null;
    };
    init_state: unknown | null;
    hash_norm?: string; // present on external message in some responses
}

function toTransactionMessage(msg: EmulationMessage): TransactionMessage {
    return {
        hash: Base64ToHex(msg.hash),
        normalizedHash: msg.hash_norm ? Base64ToHex(msg.hash_norm) : undefined,
        source: asMaybeAddressFriendly(msg.source) ?? undefined,
        destination: asMaybeAddressFriendly(msg.destination) ?? undefined,
        value: msg.value ?? undefined,
        valueExtraCurrencies: msg.value_extra_currencies,
        fwdFee: msg.fwd_fee ?? undefined,
        ihrFee: msg.ihr_fee ?? undefined,
        creationLogicalTime: msg.created_lt ?? undefined,
        createdAt: msg.created_at ? Number(msg.created_at) : undefined,
        ihrDisabled: msg.ihr_disabled ?? undefined,
        isBounce: msg.bounce ?? undefined,
        isBounced: msg.bounced ?? undefined,
        importFee: msg.import_fee ?? undefined,
        opcode: msg.opcode ?? undefined,
        messageContent: {
            hash: msg.message_content?.hash ? Base64ToHex(msg.message_content.hash) : undefined,
            body: msg.message_content?.body,
            decoded: msg.message_content?.decoded ?? undefined,
        },
    };
}

export interface EmulationAccountState {
    hash: string;
    balance: string;
    extra_currencies: Record<string, string> | null;
    account_status: EmulationAccountStatus | string;
    frozen_hash: string | null;
    data_hash: string | null;
    code_hash: string | null;
}

function toAccountState(state: EmulationAccountState): AccountState {
    return {
        hash: Base64ToHex(state.hash),
        balance: state.balance,
        extraCurrencies: state.extra_currencies ?? undefined,
        accountStatus: state.account_status ? toAccountStatus(state.account_status) : undefined,
        frozenHash: state.frozen_hash ? Base64ToHex(state.frozen_hash) : undefined,
        dataHash: state.data_hash ? Base64ToHex(state.data_hash) : undefined,
        codeHash: state.code_hash ? Base64ToHex(state.code_hash) : undefined,
    };
}

// Actions
export type EmulationActionType = 'jetton_swap' | 'call_contract' | string;

export interface EmulationActionBase {
    trace_id: string | null;
    action_id: string;
    start_lt: string;
    end_lt: string;
    start_utime: number;
    end_utime: number;
    trace_end_lt: string;
    trace_end_utime: number;
    trace_mc_seqno_end: number;
    transactions: string[]; // list of tx hashes in this action
    success: boolean;
    type: EmulationActionType;
    trace_external_hash: string;
    accounts: string[];
}

export interface EmulationJettonSwapDetails {
    dex: string; // e.g. "stonfi"
    sender: string; // address
    asset_in: string; // jetton master
    asset_out: string; // jetton master
    dex_incoming_transfer: {
        asset: string;
        source: string;
        destination: string;
        source_jetton_wallet: string | null;
        destination_jetton_wallet: string | null;
        amount: string;
    };
    dex_outgoing_transfer: {
        asset: string;
        source: string;
        destination: string;
        source_jetton_wallet: string | null;
        destination_jetton_wallet: string | null;
        amount: string;
    };
    peer_swaps: unknown[];
}

export interface EmulationCallContractDetails {
    opcode: string;
    source: string;
    destination: string;
    value: string;
    extra_currencies: Record<string, string> | null;
}

export interface EmulationTonTransferDetails {
    source: string;
    destination: string;
    value: string;
    value_extra_currencies: Record<string, string>;
    comment: string | null;
    encrypted: boolean;
}

export type EmulationActionDetails =
    | EmulationTonTransferDetails
    | EmulationJettonSwapDetails
    | EmulationCallContractDetails
    | Record<string, unknown>; // fallback for unknown action types

export interface EmulationAction extends EmulationActionBase {
    details: EmulationActionDetails;
}

function toTransactionTraceAction(action: EmulationAction): TransactionTraceAction {
    return {
        traceId: action.trace_id ?? undefined,
        actionId: action.action_id,
        startLt: action.start_lt,
        endLt: action.end_lt,
        startUtime: action.start_utime,
        endUtime: action.end_utime,
        traceEndLt: action.trace_end_lt,
        traceEndUtime: action.trace_end_utime,
        traceMcSeqnoEnd: action.trace_mc_seqno_end,
        transactions: action.transactions.map(Base64ToHex),
        isSuccess: action.success,
        traceExternalHash: Base64ToHex(action.trace_external_hash),
        // Filter out invalid addresses
        accounts: (action.accounts ?? [])
            .map(asMaybeAddressFriendly)
            .filter((addr): addr is UserFriendlyAddress => addr !== null),
        details: toTransactionTraceActionDetails(action),
    };
}

function toTransactionTraceActionDetails(action: EmulationAction): TransactionTraceActionDetails {
    if (action.type === 'jetton_swap') {
        return {
            type: 'jetton_swap',
            value: toTransactionTraceActionJettonSwapDetails(action.details as EmulationJettonSwapDetails),
        };
    } else if (action.type === 'call_contract') {
        return {
            type: 'call_contract',
            value: toTransactionTraceActionCallContractDetails(action.details as EmulationCallContractDetails),
        };
    } else if (action.type === 'ton_transfer') {
        return {
            type: 'ton_transfer',
            value: toTransactionTraceActionTONTransferDetails(action.details as EmulationTonTransferDetails),
        };
    } else {
        return {
            type: 'unknown',
            value: action.details as Record<string, unknown>,
        };
    }
}

function toTransactionTraceActionJettonSwapDetails(
    details: EmulationJettonSwapDetails,
): TransactionTraceActionJettonSwapDetails {
    return {
        dex: details.dex,
        sender: asMaybeAddressFriendly(details.sender) ?? undefined,
        dexIncomingTransfer: {
            asset: asMaybeAddressFriendly(details.dex_incoming_transfer?.asset) ?? undefined,
            source: asMaybeAddressFriendly(details.dex_incoming_transfer?.source) ?? undefined,
            destination: asMaybeAddressFriendly(details.dex_incoming_transfer?.destination) ?? undefined,
            sourceJettonWallet:
                asMaybeAddressFriendly(details.dex_incoming_transfer?.source_jetton_wallet) ?? undefined,
            destinationJettonWallet:
                asMaybeAddressFriendly(details.dex_incoming_transfer?.destination_jetton_wallet) ?? undefined,
            amount: details.dex_incoming_transfer?.amount,
        },
        dexOutgoingTransfer: {
            asset: asMaybeAddressFriendly(details.dex_outgoing_transfer?.asset) ?? undefined,
            source: asMaybeAddressFriendly(details.dex_outgoing_transfer?.source) ?? undefined,
            destination: asMaybeAddressFriendly(details.dex_outgoing_transfer?.destination) ?? undefined,
            sourceJettonWallet:
                asMaybeAddressFriendly(details.dex_outgoing_transfer?.source_jetton_wallet) ?? undefined,
            destinationJettonWallet:
                asMaybeAddressFriendly(details.dex_outgoing_transfer?.destination_jetton_wallet) ?? undefined,
            amount: details.dex_outgoing_transfer?.amount,
        },
        peerSwaps: details.peer_swaps,
    };
}

function toTransactionTraceActionCallContractDetails(
    details: EmulationCallContractDetails,
): TransactionTraceActionCallContractDetails {
    return {
        opcode: details.opcode,
        source: asMaybeAddressFriendly(details.source) ?? undefined,
        destination: asMaybeAddressFriendly(details.destination) ?? undefined,
        value: details.value,
        valueExtraCurrencies: details.extra_currencies ?? undefined,
    };
}

function toTransactionTraceActionTONTransferDetails(
    details: EmulationTonTransferDetails,
): TransactionTraceActionTONTransferDetails {
    return {
        source: asMaybeAddressFriendly(details.source) ?? undefined,
        destination: asMaybeAddressFriendly(details.destination) ?? undefined,
        value: details.value,
        valueExtraCurrencies: details.value_extra_currencies,
        comment: details.comment ?? undefined,
        isEncrypted: details.encrypted,
    };
}

// Metadata by address
export interface EmulationAddressMetadata {
    is_indexed: boolean;
    token_info?: EmulationTokenInfo[];
}

export type EmulationTokenInfo =
    | EmulationTokenInfoWallets
    | EmulationTokenInfoMasters
    | (EmulationTokenInfoBase & Record<string, unknown>);

export interface EmulationTokenInfoBase {
    valid: boolean;
    type: string;
}

export interface EmulationTokenInfoWallets extends EmulationTokenInfoBase {
    type: 'jetton_wallets';
    extra: {
        balance: string;
        jetton: string; // jetton master address
        owner: string; // owner address
    };
}

export interface EmulationTokenInfoMasters extends EmulationTokenInfoBase {
    type: 'jetton_masters';
    name: string;
    symbol: string;
    description: string;
    image?: string;
    extra: {
        _image_big?: string;
        _image_medium?: string;
        _image_small?: string;
        decimals: string;
        image_data?: string; // base64 encoded image data
        social?: string[];
        uri?: string;
        websites?: string[];
        [key: string]: unknown;
    };
}

export interface ToncenterResponseJettonMasters {
    jetton_masters: ToncenterJettonWallet[];
    address_book: Record<string, AddressBookRowV3>;
    metadata: Record<string, EmulationAddressMetadata>;
}

export interface ToncenterResponseJettonWallets {
    jetton_wallets: ToncenterJettonWallet[];
    address_book: Record<string, AddressBookRowV3>;
    metadata: Record<string, EmulationAddressMetadata>;
}

export interface ToncenterJettonWallet {
    address: string;
    balance: string;
    owner: string;
    jetton: string;
    last_transaction_lt: string;
    code_hash: string;
    data_hash: string;
}
