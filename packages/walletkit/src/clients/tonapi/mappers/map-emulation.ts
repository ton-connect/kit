/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TonApiMessage, TonApiAccountRef } from '../types/transactions';
import type { TonApiTrace } from '../types/traces';
import type { TonApiMessageConsequences } from '../types/emulation';
import type { TonApiAction, TonApiAccountEvent } from '../types/events';
import type {
    EmulationResponse,
    EmulationTraceNode,
    EmulationTransaction,
    EmulationMessage,
    EmulationAction,
    EmulationAddressBookEntry,
    EmulationAccountStatus,
    Hex,
    Base64String,
} from '../../../api/models';
import { parseBlockRef, toHex } from './map-transactions';
import { asHex } from '../../../utils/hex';
import { asAddressFriendly, asMaybeAddressFriendly } from '../../../utils/address';
import { HexToBase64 } from '../../../utils';

function mapTraceNode(trace: TonApiTrace): EmulationTraceNode {
    return {
        txHash: toHex(trace.transaction.hash),
        inMsgHash: trace.transaction.in_msg?.hash ? toHex(trace.transaction.in_msg.hash) : undefined,
        children: (trace.children ?? []).map(mapTraceNode),
    };
}

function mapMessage(raw: TonApiMessage, kind: 'in' | 'out'): EmulationMessage {
    const extraCurrencies: Record<string, string> = {};
    for (const c of raw.value_extra ?? []) {
        extraCurrencies[String(c.id)] = String(c.amount ?? 0);
    }
    // External in_msgs have no source; TonAPI returns 0 for value/fees on them, but correct value is null
    const isExternal = !raw.source;
    return {
        hash: toHex(raw.hash),
        source: raw.source?.address ? asAddressFriendly(raw.source.address) : undefined,
        destination: raw.destination?.address ? (asAddressFriendly(raw.destination.address) ?? '') : '',
        value: isExternal ? undefined : raw.value != null ? String(raw.value) : undefined,
        valueExtraCurrencies: extraCurrencies,
        fwdFee: isExternal ? undefined : raw.fwd_fee != null ? String(raw.fwd_fee) : undefined,
        ihrFee: isExternal ? undefined : raw.ihr_fee != null ? String(raw.ihr_fee) : undefined,
        // ext_in messages don't have created_lt/created_at/ihr_disabled/bounce/bounced in TON protocol
        createdLt: isExternal ? undefined : raw.created_lt != null ? String(raw.created_lt) : undefined,
        createdAt: isExternal ? undefined : raw.created_at != null ? Number(raw.created_at) : undefined,
        opcode: raw.op_code ? asHex(raw.op_code) : undefined,
        ihrDisabled: isExternal ? undefined : (raw.ihr_disabled ?? undefined),
        isBounce: isExternal ? undefined : (raw.bounce ?? undefined),
        isBounced: isExternal ? undefined : (raw.bounced ?? undefined),
        // importFee only applies to external in_msgs; internal in_msgs and out_msgs have undefined
        importFee:
            kind === 'out' || !isExternal ? undefined : raw.import_fee != null ? String(raw.import_fee) : undefined,
        messageContent: {
            hash: undefined,
            body: HexToBase64(('0x' + raw.raw_body) as Hex) as Base64String,
            decoded: raw.decoded_body ?? undefined,
        },
        initState: undefined,
    };
}

function mapAccountStatus(status: string | undefined): EmulationAccountStatus {
    if (status === 'active') return 'active';
    if (status === 'frozen') return 'frozen';
    if (status === 'nonexist') return 'nonexist';
    return 'uninit';
}

function normalizeTransactionType(type: string | undefined): string {
    switch (type) {
        case 'TransOrd':
            return 'ord';
        case 'TransTickTock':
            return 'ticktock';
        case 'TransStorage':
            return 'storage';
        case 'TransCreditFirst':
            return 'credit_first';
        default:
            return type ?? 'ord';
    }
}

function normalizeStatusChange(status: string | undefined): string {
    if (!status) return 'unchanged';
    return status.startsWith('acst_') ? status.slice(5) : status;
}

function mapTransaction(traceNode: TonApiTrace, rootHash: Hex): EmulationTransaction {
    const raw = traceNode.transaction;
    // TonAPI omits out_msgs for child transactions — derive them from children's in_msg
    const childInMsgs = (traceNode.children ?? [])
        .map((c) => c.transaction.in_msg)
        .filter((m): m is TonApiMessage => m != null);
    const outMsgs = raw.out_msgs && raw.out_msgs.length > 0 ? raw.out_msgs : childInMsgs;

    const blockRef = parseBlockRef(raw.block);
    return {
        account: asAddressFriendly(raw.account.address),
        hash: toHex(raw.hash),
        lt: String(raw.lt ?? 0),
        now: Number(raw.utime ?? 0),
        mcBlockSeqno: blockRef.seqno,
        traceExternalHash: rootHash,
        prevTransHash: raw.prev_trans_hash ? toHex(raw.prev_trans_hash) : undefined,
        prevTransLt: raw.prev_trans_lt != null ? String(raw.prev_trans_lt) : undefined,
        origStatus: mapAccountStatus(raw.orig_status),
        endStatus: mapAccountStatus(raw.end_status),
        totalFees: String(raw.total_fees ?? 0),
        totalFeesExtraCurrencies: {},
        description: {
            type: normalizeTransactionType(raw.transaction_type),
            isAborted: raw.aborted ?? !(raw.success ?? true),
            isDestroyed: raw.destroyed ?? false,
            // TonAPI doesn't expose credit_first; derive from bounce flag:
            // external (bounce=false/null) and internal bounce=false → credit_first=true
            // internal bounce=true → credit_first=false
            isCreditFirst: !raw.in_msg?.bounce,
            isTock: false,
            isInstalled: false,
            storagePhase: {
                storageFeesCollected: String(raw.storage_phase?.storage_fees_collected ?? 0),
                statusChange: normalizeStatusChange(raw.storage_phase?.status_change),
            },
            creditPhase: raw.credit_phase?.credit != null ? { credit: String(raw.credit_phase.credit) } : undefined,
            computePhase: {
                isSkipped: raw.compute_phase?.skipped ?? false,
                isSuccess: raw.compute_phase?.success ?? raw.success ?? true,
                isMsgStateUsed: false,
                isAccountActivated: false,
                gasFees: String(raw.compute_phase?.gas_fees ?? 0),
                gasUsed: String(raw.compute_phase?.gas_used ?? 0),
                gasLimit: String(raw.compute_phase?.gas_used ?? 0),
                mode: 0,
                exitCode: raw.compute_phase?.exit_code ?? (raw.success ? 0 : 1),
                vmSteps: raw.compute_phase?.vm_steps ?? 0,
            },
            actionPhase: raw.action_phase
                ? {
                      isSuccess: raw.action_phase.success ?? raw.success ?? true,
                      isValid: true,
                      hasNoFunds: false,
                      statusChange: 'unchanged',
                      totalFwdFees: String(raw.action_phase.fwd_fees ?? 0),
                      totalActionFees: String(raw.action_phase.total_fees ?? 0),
                      resultCode: raw.action_phase.result_code ?? 0,
                      totalActions: raw.action_phase.total_actions ?? 0,
                      specActions: 0,
                      skippedActions: raw.action_phase.skipped_actions ?? 0,
                      msgsCreated: outMsgs.length,
                      totalMsgSize: { cells: 0, bits: 0 },
                  }
                : undefined,
        },
        blockRef,
        inMsg: raw.in_msg ? mapMessage(raw.in_msg, 'in') : undefined,
        outMsgs: outMsgs.map((m) => mapMessage(m, 'out')),
        accountStateBefore: {
            balance: String(raw.end_balance ?? 0),
            accountStatus: mapAccountStatus(raw.orig_status),
        },
        accountStateAfter: {
            balance: String(raw.end_balance ?? 0),
            accountStatus: mapAccountStatus(raw.end_status),
        },
        isEmulated: true,
        traceId: undefined,
    };
}

function flattenTrace(trace: TonApiTrace): TonApiTrace[] {
    return [trace, ...(trace.children ?? []).flatMap(flattenTrace)];
}

function buildAddressBook(traces: TonApiTrace[]): Record<string, EmulationAddressBookEntry> {
    const book: Record<string, EmulationAddressBookEntry> = {};

    function addRef(ref: TonApiAccountRef | undefined) {
        if (!ref?.address) return;
        const key = ref.address.toUpperCase();
        if (!book[key]) {
            book[key] = {
                userFriendly: asAddressFriendly(ref.address),
                domain: ref.name ?? undefined,
                interfaces: [],
            };
        }
    }

    for (const node of traces) {
        const tx = node.transaction;
        addRef(tx.account);
        if (tx.in_msg?.source) addRef(tx.in_msg.source);
        if (tx.in_msg?.destination) addRef(tx.in_msg.destination);
        for (const msg of tx.out_msgs ?? []) {
            if (msg.source) addRef(msg.source);
            if (msg.destination) addRef(msg.destination);
        }
    }

    return book;
}

function normalizeJettonTransferDetails(payload: Record<string, unknown>): Record<string, unknown> {
    const sender = payload.sender as { address?: string } | undefined;
    const recipient = payload.recipient as { address?: string } | undefined;
    const jetton = payload.jetton as { address?: string } | undefined;
    return {
        asset: jetton?.address ?? null,
        sender: sender?.address ?? null,
        receiver: recipient?.address ?? null,
        sender_jetton_wallet: (payload.senders_wallet as string | undefined) ?? null,
        receiver_jetton_wallet: (payload.recipients_wallet as string | undefined) ?? null,
        amount: payload.amount ?? '0',
        comment: (payload.comment as string | undefined) ?? null,
        is_encrypted_comment: (payload.is_encrypted_comment as boolean | undefined) ?? false,
        query_id: payload.query_id ?? '0',
        response_destination: payload.response_destination ?? null,
        custom_payload: payload.custom_payload ?? null,
        forward_payload: payload.forward_payload ?? null,
        forward_amount: payload.forward_amount ?? '0',
    };
}

function _mapAction(action: TonApiAction, event: TonApiAccountEvent, rootHash: Hex): EmulationAction {
    const lt = String(event.lt ?? 0);
    const utime = Number(event.timestamp ?? 0);
    const actionId = toHex(String(action.base_transactions?.[0] ?? event.event_id));
    const transactions = (action.base_transactions ?? []).map((h) => toHex(String(h)));

    let type = action.type ?? 'unknown';
    let details: Record<string, unknown> = {};

    const payload = type ? (action[type] as Record<string, unknown> | undefined) : undefined;

    if (type === 'TonTransfer' && payload) {
        type = 'ton_transfer';
        details = {
            source: (payload.sender as { address?: string } | undefined)?.address ?? '',
            destination: (payload.recipient as { address?: string } | undefined)?.address ?? '',
            value: String(payload.amount ?? 0),
            value_extra_currencies: null,
            comment: (payload.comment as string | undefined) ?? null,
            encrypted: false,
        };
    } else if (type === 'JettonTransfer' && payload) {
        type = 'jetton_transfer';
        details = normalizeJettonTransferDetails(payload);
    } else if (type === 'NftItemTransfer' && payload) {
        type = 'nft_transfer';
        const sender = payload.sender as { address?: string } | undefined;
        const recipient = payload.recipient as { address?: string } | undefined;
        details = {
            nft_collection: null,
            nft_item: (payload.nft as string | undefined) ?? null,
            nft_item_index: null,
            old_owner: sender?.address ?? null,
            new_owner: recipient?.address ?? null,
            is_purchase: false,
            query_id: '0',
            response_destination: null,
            custom_payload: null,
            forward_payload: null,
            forward_amount: '0',
            comment: null,
            is_encrypted_comment: false,
            marketplace: null,
        };
    } else if (type === 'JettonSwap' && payload) {
        type = 'jetton_swap';
        const inAsset = payload.in as { jetton?: { address?: string }; amount?: string } | undefined;
        const outAsset = payload.out as { jetton?: { address?: string }; amount?: string } | undefined;
        const userWallet = payload.user_wallet as { address?: string } | undefined;
        const router = payload.router as { address?: string } | undefined;
        details = {
            dex: payload.dex ?? '',
            sender: userWallet?.address ?? '',
            dex_incoming_transfer: {
                asset: inAsset?.jetton?.address ?? 'TON',
                source: userWallet?.address ?? '',
                destination: router?.address ?? '',
                source_jetton_wallet: null,
                destination_jetton_wallet: null,
                amount: String(payload.amount_in ?? payload.ton_in ?? inAsset?.amount ?? 0),
            },
            dex_outgoing_transfer: {
                asset: outAsset?.jetton?.address ?? 'TON',
                source: router?.address ?? '',
                destination: userWallet?.address ?? '',
                source_jetton_wallet: null,
                destination_jetton_wallet: null,
                amount: String(payload.amount_out ?? payload.ton_out ?? outAsset?.amount ?? 0),
            },
            peer_swaps: [],
        };
    } else if (type === 'ContractDeploy' && payload) {
        type = 'contract_deploy';
        const addr = payload.address as string | undefined;
        details = {
            opcode: null,
            destination: addr ?? null,
        };
    } else if (payload) {
        details = payload;
    }

    return {
        actionId,
        startLt: lt,
        endLt: lt,
        startUtime: utime,
        endUtime: utime,
        traceEndLt: '0',
        traceEndUtime: 0,
        traceMcSeqnoEnd: 0,
        transactions,
        isSuccess: action.status === 'ok',
        type,
        traceExternalHash: rootHash,
        accounts: (action.simple_preview?.accounts ?? []).map((a) => {
            const addr = typeof a === 'string' ? a : (a as { address: string }).address;
            return asMaybeAddressFriendly(addr) ?? addr;
        }),
        details,
    };
}

export function mapTonApiEmulationResponse(result: TonApiMessageConsequences): EmulationResponse {
    const rootTxHash = toHex(result.transaction.hash);
    // Use the external in_msg hash as the trace identifier — matches Toncenter's traceExternalHash convention.
    const externalHash = result.transaction.in_msg?.hash ? toHex(result.transaction.in_msg.hash) : rootTxHash;
    const allTraces = flattenTrace(result);
    const transactions = Object.fromEntries(
        allTraces.map((traceNode) => {
            const hash = toHex(traceNode.transaction.hash);
            const mappedTransaction = mapTransaction(traceNode, externalHash);

            if (traceNode.children) {
                for (const child of traceNode.children) {
                    const childTransaction = mapTransaction(child, externalHash);
                    if (childTransaction.inMsg) {
                        // avoid duplicate outMsgs
                        if (!mappedTransaction.outMsgs.some((m) => m.hash === childTransaction?.inMsg?.hash)) {
                            mappedTransaction.outMsgs.push(childTransaction.inMsg);
                        }
                    }
                }
            }

            return [hash, mappedTransaction];
        }),
    );
    // const actions = (result.event.actions ?? []).map((a) => mapAction(a, result.event, externalHash));

    return {
        mcBlockSeqno: transactions[rootTxHash]?.mcBlockSeqno ?? 0,
        trace: mapTraceNode(result),
        transactions,
        actions: [],
        randSeed: asHex('0x' + '0'.repeat(64)),
        isIncomplete: false,
        codeCells: {},
        dataCells: {},
        addressBook: buildAddressBook(allTraces),
    };
}
