/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterEmulationResponse, EmulationAction as RawAction } from '../types/raw-emulation';
import type {
    EmulationMessage as RawMessage,
    EmulationTraceNode as RawTraceNode,
    EmulationAccountState as RawAccountState,
    EmulationTransactionDescription as RawDescription,
    ToncenterTransaction as RawTransaction,
} from '../../../types/toncenter/emulation';
import type {
    EmulationResponse,
    EmulationTraceNode,
    EmulationTransaction,
    EmulationTransactionDescription,
    EmulationAccountState,
    EmulationMessage,
    EmulationAction,
    EmulationAddressBookEntry,
} from '../../../api/models/emulation';
import { Base64ToHex } from '../../../utils/base64';
import { asAddressFriendly, asMaybeAddressFriendly } from '../../../utils/address';
import { computeMoneyFlow } from './map-emulation-money-flow';

function mapTraceNode(node: RawTraceNode): EmulationTraceNode {
    return {
        txHash: Base64ToHex(node.tx_hash),
        inMsgHash: node.in_msg_hash ? Base64ToHex(node.in_msg_hash) : undefined,
        children: node.children?.map(mapTraceNode) ?? [],
    };
}

function mapAccountState(state: RawAccountState): EmulationAccountState {
    return {
        hash: Base64ToHex(state.hash),
        balance: state.balance,
        extraCurrencies: state.extra_currencies,
        accountStatus: state.account_status,
        frozenHash: state.frozen_hash ? Base64ToHex(state.frozen_hash) : null,
        dataHash: state.data_hash ? Base64ToHex(state.data_hash) : null,
        codeHash: state.code_hash ? Base64ToHex(state.code_hash) : null,
    };
}

function mapDescription(desc: RawDescription): EmulationTransactionDescription {
    return {
        type: desc.type,
        isAborted: desc.aborted,
        isDestroyed: desc.destroyed,
        isCreditFirst: desc.credit_first,
        isTock: desc.is_tock,
        isInstalled: desc.installed,
        storagePhase: {
            storageFeesCollected: desc.storage_ph.storage_fees_collected,
            statusChange: desc.storage_ph.status_change,
        },
        creditPhase: desc.credit_ph ? { credit: desc.credit_ph.credit } : undefined,
        computePhase: {
            isSkipped: desc.compute_ph.skipped,
            isSuccess: desc.compute_ph.success,
            isMsgStateUsed: desc.compute_ph.msg_state_used,
            isAccountActivated: desc.compute_ph.account_activated,
            gasFees: desc.compute_ph.gas_fees,
            gasUsed: desc.compute_ph.gas_used,
            gasLimit: desc.compute_ph.gas_limit,
            gasCredit: desc.compute_ph.gas_credit,
            mode: desc.compute_ph.mode,
            exitCode: desc.compute_ph.exit_code,
            vmSteps: desc.compute_ph.vm_steps,
            vmInitStateHash: desc.compute_ph.vm_init_state_hash
                ? Base64ToHex(desc.compute_ph.vm_init_state_hash)
                : undefined,
            vmFinalStateHash: desc.compute_ph.vm_final_state_hash
                ? Base64ToHex(desc.compute_ph.vm_final_state_hash)
                : undefined,
        },
        actionPhase: desc.action
            ? {
                  isSuccess: desc.action.success,
                  isValid: desc.action.valid,
                  hasNoFunds: desc.action.no_funds,
                  statusChange: desc.action.status_change,
                  totalFwdFees: desc.action.total_fwd_fees,
                  totalActionFees: desc.action.total_action_fees,
                  resultCode: desc.action.result_code,
                  totalActions: desc.action.tot_actions,
                  specActions: desc.action.spec_actions,
                  skippedActions: desc.action.skipped_actions,
                  msgsCreated: desc.action.msgs_created,
                  actionListHash: desc.action.action_list_hash ? Base64ToHex(desc.action.action_list_hash) : undefined,
                  totalMsgSize: { cells: desc.action.tot_msg_size.cells, bits: desc.action.tot_msg_size.bits },
              }
            : undefined,
    };
}

function mapMessage(msg: RawMessage): EmulationMessage {
    return {
        hash: Base64ToHex(msg.hash),
        normalizedHash: msg.hash_norm ? Base64ToHex(msg.hash_norm) : undefined,
        source: asMaybeAddressFriendly(msg.source),
        destination: asMaybeAddressFriendly(msg.destination) ?? msg.destination,
        value: msg.value,
        valueExtraCurrencies: msg.value_extra_currencies,
        fwdFee: msg.fwd_fee,
        ihrFee: msg.ihr_fee,
        createdLt: msg.created_lt,
        createdAt: msg.created_at !== null ? Number(msg.created_at) : null,
        opcode: msg.opcode,
        ihrDisabled: msg.ihr_disabled,
        isBounce: msg.bounce,
        isBounced: msg.bounced,
        importFee: msg.import_fee,
        messageContent: {
            hash: msg.message_content?.hash ? Base64ToHex(msg.message_content.hash) : '',
            body: msg.message_content?.body ?? '',
            decoded: msg.message_content?.decoded ?? null,
        },
        initState: msg.init_state,
    };
}

function mapTransaction(tx: RawTransaction): EmulationTransaction {
    return {
        account: asAddressFriendly(tx.account),
        hash: Base64ToHex(tx.hash),
        lt: tx.lt,
        now: tx.now,
        mcBlockSeqno: tx.mc_block_seqno,
        traceExternalHash: tx.trace_external_hash ? Base64ToHex(tx.trace_external_hash) : '',
        prevTransHash: tx.prev_trans_hash ? Base64ToHex(tx.prev_trans_hash) : null,
        prevTransLt: tx.prev_trans_lt,
        origStatus: tx.orig_status,
        endStatus: tx.end_status,
        totalFees: tx.total_fees,
        totalFeesExtraCurrencies: tx.total_fees_extra_currencies,
        description: mapDescription(tx.description),
        blockRef: { workchain: tx.block_ref.workchain, shard: tx.block_ref.shard, seqno: tx.block_ref.seqno },
        inMsg: tx.in_msg ? mapMessage(tx.in_msg) : null,
        outMsgs: tx.out_msgs?.map(mapMessage) ?? [],
        accountStateBefore: mapAccountState(tx.account_state_before),
        accountStateAfter: mapAccountState(tx.account_state_after),
        isEmulated: tx.emulated,
        ...(tx.trace_id !== undefined ? { traceId: tx.trace_id } : {}),
    };
}

function mapAction(action: RawAction): EmulationAction {
    return {
        traceId: action.trace_id,
        actionId: Base64ToHex(action.action_id),
        startLt: action.start_lt,
        endLt: action.end_lt,
        startUtime: action.start_utime,
        endUtime: action.end_utime,
        traceEndLt: action.trace_end_lt,
        traceEndUtime: action.trace_end_utime,
        traceMcSeqnoEnd: action.trace_mc_seqno_end,
        transactions: action.transactions.map(Base64ToHex),
        isSuccess: action.success,
        type: action.type,
        traceExternalHash: Base64ToHex(action.trace_external_hash),
        accounts: action.accounts.map(asMaybeAddressFriendly).filter((a): a is string => a !== null),
        details: action.details as Record<string, unknown>,
    };
}

export function mapToncenterEmulationResponse(raw: ToncenterEmulationResponse): EmulationResponse {
    const transactions: Record<string, EmulationTransaction> = Object.fromEntries(
        Object.entries(raw.transactions ?? {}).map(([hash, tx]) => [Base64ToHex(hash), mapTransaction(tx)]),
    );

    const addressBook: Record<string, EmulationAddressBookEntry> = Object.fromEntries(
        Object.entries(raw.address_book ?? {}).map(([addr, row]) => [
            addr,
            {
                domain: row.domain ?? undefined,
                userFriendly: asAddressFriendly(row.user_friendly),
                interfaces: row.interfaces ?? [],
            },
        ]),
    );

    const codeCells: Record<string, string> = Object.fromEntries(
        Object.entries(raw.code_cells ?? {}).map(([hash, cell]) => [Base64ToHex(hash), cell]),
    );

    const dataCells: Record<string, string> = Object.fromEntries(
        Object.entries(raw.data_cells ?? {}).map(([hash, cell]) => [Base64ToHex(hash), cell]),
    );

    return {
        mcBlockSeqno: raw.mc_block_seqno,
        trace: mapTraceNode(raw.trace),
        transactions,
        actions: raw.actions?.map(mapAction) ?? [],
        randSeed: Base64ToHex(raw.rand_seed),
        isIncomplete: raw.is_incomplete,
        codeCells,
        dataCells,
        addressBook,
        moneyFlow: computeMoneyFlow(raw),
    };
}
