/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    Transaction,
    AccountState,
    AccountStatus,
    TransactionMessage,
    TransactionDescription,
    TransactionBlockRef,
    TransactionComputePhase,
} from '../../../api/models';
import { Base64ToHex } from '../../../utils/base64';
import { asAddressFriendly, asMaybeAddressFriendly } from '../../../utils/address';
import type { StreamingV2AccountState, StreamingV2TransactionRaw, StreamingV2TransactionDescription } from '../types';
import type { EmulationBlockRef, EmulationMessage } from '../../../types/toncenter/emulation';

const toAccountStatus = (status: string | null | undefined): AccountStatus | undefined => {
    if (!status) return undefined;
    if (status === 'active') return { type: 'active' };
    if (status === 'frozen') return { type: 'frozen' };
    if (status === 'uninit') return { type: 'uninit' };
    return { type: 'unknown', value: status };
};

const toAccountState = (state: StreamingV2AccountState): AccountState => {
    return {
        hash: Base64ToHex(state.hash),
        balance: state.balance ?? '0',
        extraCurrencies: state.extra_currencies ?? undefined,
        accountStatus: toAccountStatus(state.account_status),
        frozenHash: state.frozen_hash ? Base64ToHex(state.frozen_hash) : undefined,
        dataHash: state.data_hash ? Base64ToHex(state.data_hash) : undefined,
        codeHash: state.code_hash ? Base64ToHex(state.code_hash) : undefined,
    };
};

const toTransactionBlockRef = (ref: EmulationBlockRef): TransactionBlockRef => {
    return {
        workchain: ref.workchain,
        shard: ref.shard,
        seqno: ref.seqno,
    };
};

const toTransactionMessage = (msg: EmulationMessage): TransactionMessage => {
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
        opcode: msg.opcode ?? undefined,
        ihrDisabled: msg.ihr_disabled ?? undefined,
        isBounce: msg.bounce ?? undefined,
        isBounced: msg.bounced ?? undefined,
        importFee: msg.import_fee ?? undefined,
        messageContent: msg.message_content
            ? {
                  hash: msg.message_content.hash ? Base64ToHex(msg.message_content.hash) : undefined,
                  decoded: msg.message_content.decoded ?? undefined,
              }
            : undefined,
    };
};

const toComputePhase = (desc: StreamingV2TransactionDescription): TransactionComputePhase => {
    const computePh = desc.compute_ph;
    const isSkipped = 'skipped' in computePh && computePh.skipped;

    if (isSkipped) {
        return { isSkipped: true, isSuccess: false };
    }

    const full = computePh as Exclude<typeof computePh, { skipped: true }>;
    return {
        isSkipped: false,
        isSuccess: full.success,
        isMessageStateUsed: full.msg_state_used,
        isAccountActivated: full.account_activated,
        gasFees: full.gas_fees,
        gasUsed: full.gas_used,
        gasLimit: full.gas_limit,
        gasCredit: full.gas_credit,
        mode: full.mode,
        exitCode: full.exit_code,
        vmStepsNumber: full.vm_steps,
        vmInitStateHash: full.vm_init_state_hash ? Base64ToHex(full.vm_init_state_hash) : undefined,
        vmFinalStateHash: full.vm_final_state_hash ? Base64ToHex(full.vm_final_state_hash) : undefined,
    };
};

const toTransactionDescription = (desc: StreamingV2TransactionDescription): TransactionDescription => {
    const action = desc.action;
    return {
        type: desc.type,
        isAborted: desc.aborted,
        isDestroyed: desc.destroyed,
        isCreditFirst: desc.credit_first,
        isTock: desc.is_tock,
        isInstalled: desc.installed,
        storagePhase: desc.storage_ph
            ? {
                  storageFeesCollected: desc.storage_ph.storage_fees_collected,
                  statusChange: desc.storage_ph.status_change,
              }
            : undefined,
        creditPhase: desc.credit_ph ? { credit: desc.credit_ph.credit } : undefined,
        computePhase: toComputePhase(desc),
        action: action
            ? {
                  isSuccess: action.success,
                  isValid: action.valid,
                  hasNoFunds: action.no_funds,
                  statusChange: action.status_change,
                  totalForwardingFees: action.total_fwd_fees,
                  totalActionFees: action.total_action_fees,
                  resultCode: action.result_code,
                  totalActionsNumber: action.tot_actions,
                  specActionsNumber: action.spec_actions,
                  skippedActionsNumber: action.skipped_actions,
                  messagesCreatedNumber: action.msgs_created,
                  actionListHash: action.action_list_hash ? Base64ToHex(action.action_list_hash) : undefined,
                  totalMessagesSize: action.tot_msg_size,
              }
            : undefined,
    };
};

/**
 * Maps a streaming v2 raw transaction directly to the provider-agnostic Transaction type.
 * `traceExternalHashNorm` comes from the notification envelope (base64url encoded).
 */
export const toStreamingTransaction = (raw: StreamingV2TransactionRaw, traceExternalHashNorm: string): Transaction => {
    return {
        account: asAddressFriendly(raw.account),
        hash: Base64ToHex(raw.hash),
        logicalTime: raw.lt,
        now: raw.now,
        mcBlockSeqno: raw.mc_block_seqno,
        traceExternalHash: Base64ToHex(traceExternalHashNorm),
        traceId: raw.trace_id,
        previousTransactionHash: raw.prev_trans_hash ? Base64ToHex(raw.prev_trans_hash) : undefined,
        previousTransactionLogicalTime: raw.prev_trans_lt ?? undefined,
        origStatus: toAccountStatus(raw.orig_status),
        endStatus: toAccountStatus(raw.end_status),
        totalFees: raw.total_fees,
        totalFeesExtraCurrencies: raw.total_fees_extra_currencies ?? {},
        blockRef: raw.block_ref ? toTransactionBlockRef(raw.block_ref) : undefined,
        inMessage: raw.in_msg ? toTransactionMessage(raw.in_msg) : undefined,
        outMessages: raw.out_msgs?.map(toTransactionMessage) ?? [],
        accountStateBefore: toAccountState(raw.account_state_before),
        accountStateAfter: toAccountState(raw.account_state_after),
        description: toTransactionDescription(raw.description),
        isEmulated: raw.emulated ?? false,
    };
};
