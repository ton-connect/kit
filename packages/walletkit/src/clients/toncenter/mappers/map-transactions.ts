/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Base64ToHex } from '../../../utils/base64';
import type {
    AccountState,
    AccountStatus,
    Transaction,
    TransactionMessage,
    TransactionDescription,
    TransactionBlockRef,
    TransactionsResponse,
    Base64String,
} from '../../../api/models';
import { asAddressFriendly, asMaybeAddressFriendly } from '../../../utils/address';
import { parseMsgSizeCount } from '../utils';
import { toAddressBook } from '../../../types/toncenter/v3/AddressBookRowV3';
import type {
    ToncenterTransaction,
    ToncenterTransactionsResponse,
    EmulationAccountStatus,
    EmulationBlockRef,
    EmulationTransactionDescription,
    EmulationMessage,
    EmulationAccountState,
} from '../../../types/toncenter/emulation';

export function toTransactionsResponse(response: ToncenterTransactionsResponse): TransactionsResponse {
    return {
        transactions: response.transactions?.map(toTransaction) ?? [],
        addressBook: toAddressBook(response.address_book),
    };
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

function toTransactionBlockRef(ref: EmulationBlockRef): TransactionBlockRef {
    return {
        workchain: ref.workchain,
        shard: ref.shard,
        seqno: ref.seqno,
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
                cells: parseMsgSizeCount(desc.action?.tot_msg_size.cells),
                bits: parseMsgSizeCount(desc.action?.tot_msg_size.bits),
            },
        },
    };
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
            body: msg.message_content?.body ? (msg.message_content.body as Base64String) : undefined,
            decoded: msg.message_content?.decoded ?? undefined,
        },
    };
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
