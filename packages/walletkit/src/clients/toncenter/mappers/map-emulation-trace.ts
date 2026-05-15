/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    TransactionAccountState,
    TransactionAccountStatus,
    Transaction,
    TransactionMessage,
    TransactionDescription,
    TransactionTraceNode,
    TransactionTraceAction,
    TransactionTraceActionDetails,
    TransactionTraceActionJettonSwapDetails,
    TransactionTraceActionCallContractDetails,
    TransactionTraceActionTONTransferDetails,
    TransactionEmulatedTrace,
    UserFriendlyAddress,
    AddressBook,
    EmulationResponse,
    EmulationTraceNode as DomainEmulationTraceNode,
    EmulationTransaction as DomainEmulationTransaction,
    EmulationTransactionDescription as DomainEmulationTransactionDescription,
    EmulationAccountState as DomainEmulationAccountState,
    EmulationMessage as DomainEmulationMessage,
    EmulationAction as DomainEmulationAction,
    EmulationAddressBookEntry as DomainEmulationAddressBookEntry,
    EmulationAccountStatus,
} from '../../../api/models';
import { asMaybeAddressFriendly } from '../../../utils/address';
import type {
    EmulationJettonSwapDetails,
    EmulationCallContractDetails,
    EmulationTonTransferDetails,
} from '../types/raw-emulation';

export function toTransactionEmulatedTrace(response: EmulationResponse): TransactionEmulatedTrace {
    return {
        mcBlockSeqno: response.mcBlockSeqno,
        trace: domainTraceNodeToTransactionTraceNode(response.trace),
        transactions: Object.fromEntries(
            Object.entries(response.transactions ?? {}).map(([hash, tx]) => [hash, emulationTxToTransaction(tx)]),
        ),
        actions: response.actions.map(emulationActionToTransactionTraceAction),
        randSeed: response.randSeed,
        isIncomplete: response.isIncomplete,
        codeCells: Object.fromEntries(Object.entries(response.codeCells ?? {}).map(([hash, cell]) => [hash, cell])),
        dataCells: Object.fromEntries(Object.entries(response.dataCells ?? {}).map(([hash, cell]) => [hash, cell])),
        metadata: {},
        addressBook: emulationAddressBookToAddressBook(response.addressBook),
    };
}

function domainTraceNodeToTransactionTraceNode(node: DomainEmulationTraceNode): TransactionTraceNode {
    return {
        txHash: node.txHash,
        inMsgHash: node.inMsgHash,
        children: node.children?.map(domainTraceNodeToTransactionTraceNode) ?? [],
    };
}

function emulationAccountStateToAccountState(state: DomainEmulationAccountState): TransactionAccountState {
    return {
        hash: state.hash ?? undefined,
        balance: state.balance,
        extraCurrencies: state.extraCurrencies ?? undefined,
        accountStatus: toAccountStatus(state.accountStatus),
        frozenHash: state.frozenHash ?? undefined,
        dataHash: state.dataHash ?? undefined,
        codeHash: state.codeHash ?? undefined,
    };
}

function toAccountStatus(status: EmulationAccountStatus): TransactionAccountStatus {
    switch (status) {
        case 'active':
            return { type: 'active' };
        case 'frozen':
            return { type: 'frozen' };
        case 'uninit':
            return { type: 'uninit' };
        case 'nonexist':
            return { type: 'nonexist' };
        default:
            return { type: 'unknown', value: status };
    }
}

function emulationMsgToTransactionMessage(msg: DomainEmulationMessage): TransactionMessage {
    return {
        hash: msg.hash,
        normalizedHash: msg.normalizedHash,
        source: msg.source ?? undefined,
        destination: msg.destination ?? undefined,
        value: msg.value ?? undefined,
        valueExtraCurrencies: msg.valueExtraCurrencies ?? undefined,
        fwdFee: msg.fwdFee ?? undefined,
        ihrFee: msg.ihrFee ?? undefined,
        creationLogicalTime: msg.createdLt ?? undefined,
        createdAt: msg.createdAt ?? undefined,
        ihrDisabled: msg.ihrDisabled ?? undefined,
        isBounce: msg.isBounce ?? undefined,
        isBounced: msg.isBounced ?? undefined,
        importFee: msg.importFee ?? undefined,
        opcode: msg.opcode ?? undefined,
        messageContent: {
            hash: msg.messageContent.hash ?? undefined,
            body: msg.messageContent.body ?? undefined,
            decoded: msg.messageContent.decoded ?? undefined,
        },
    };
}

function emulationDescToTransactionDescription(desc: DomainEmulationTransactionDescription): TransactionDescription {
    return {
        type: desc.type,
        isAborted: desc.isAborted,
        isDestroyed: desc.isDestroyed,
        isCreditFirst: desc.isCreditFirst,
        isTock: desc.isTock,
        isInstalled: desc.isInstalled,
        storagePhase: {
            storageFeesCollected: desc.storagePhase.storageFeesCollected,
            statusChange: desc.storagePhase.statusChange,
        },
        creditPhase: desc.creditPhase ? { credit: desc.creditPhase.credit } : undefined,
        computePhase: {
            isSkipped: desc.computePhase.isSkipped,
            isSuccess: desc.computePhase.isSuccess,
            isMessageStateUsed: desc.computePhase.isMsgStateUsed,
            isAccountActivated: desc.computePhase.isAccountActivated,
            gasFees: desc.computePhase.gasFees,
            gasUsed: desc.computePhase.gasUsed,
            gasLimit: desc.computePhase.gasLimit,
            gasCredit: desc.computePhase.gasCredit,
            mode: desc.computePhase.mode,
            exitCode: desc.computePhase.exitCode,
            vmStepsNumber: desc.computePhase.vmSteps,
            vmInitStateHash: desc.computePhase.vmInitStateHash,
            vmFinalStateHash: desc.computePhase.vmFinalStateHash,
        },
        action: desc.actionPhase
            ? {
                  isSuccess: desc.actionPhase.isSuccess,
                  isValid: desc.actionPhase.isValid,
                  hasNoFunds: desc.actionPhase.hasNoFunds,
                  statusChange: desc.actionPhase.statusChange,
                  totalForwardingFees: desc.actionPhase.totalFwdFees,
                  totalActionFees: desc.actionPhase.totalActionFees,
                  resultCode: desc.actionPhase.resultCode,
                  totalActionsNumber: desc.actionPhase.totalActions,
                  specActionsNumber: desc.actionPhase.specActions,
                  skippedActionsNumber: desc.actionPhase.skippedActions,
                  messagesCreatedNumber: desc.actionPhase.msgsCreated,
                  actionListHash: desc.actionPhase.actionListHash,
                  totalMessagesSize: {
                      cells: desc.actionPhase.totalMsgSize.cells,
                      bits: desc.actionPhase.totalMsgSize.bits,
                  },
              }
            : undefined,
    };
}

function emulationTxToTransaction(tx: DomainEmulationTransaction): Transaction {
    return {
        account: tx.account,
        hash: tx.hash,
        logicalTime: tx.lt,
        now: tx.now,
        mcBlockSeqno: tx.mcBlockSeqno,
        traceExternalHash: tx.traceExternalHash,
        traceId: tx.traceId,
        previousTransactionHash: tx.prevTransHash ?? undefined,
        previousTransactionLogicalTime: tx.prevTransLt ?? undefined,
        origStatus: toAccountStatus(tx.origStatus),
        endStatus: toAccountStatus(tx.endStatus),
        totalFees: tx.totalFees,
        totalFeesExtraCurrencies: tx.totalFeesExtraCurrencies,
        blockRef: tx.blockRef,
        inMessage: tx.inMsg ? emulationMsgToTransactionMessage(tx.inMsg) : undefined,
        outMessages: tx.outMsgs.map(emulationMsgToTransactionMessage),
        accountStateBefore: emulationAccountStateToAccountState(tx.accountStateBefore),
        accountStateAfter: emulationAccountStateToAccountState(tx.accountStateAfter),
        isEmulated: tx.isEmulated,
        description: emulationDescToTransactionDescription(tx.description),
    };
}

function emulationActionToTransactionTraceAction(action: DomainEmulationAction): TransactionTraceAction {
    return {
        traceId: action.traceId ?? undefined,
        actionId: action.actionId,
        startLt: action.startLt,
        endLt: action.endLt,
        startUtime: action.startUtime,
        endUtime: action.endUtime,
        traceEndLt: action.traceEndLt,
        traceEndUtime: action.traceEndUtime,
        traceMcSeqnoEnd: action.traceMcSeqnoEnd,
        transactions: action.transactions,
        isSuccess: action.isSuccess,
        traceExternalHash: action.traceExternalHash,
        accounts: action.accounts as UserFriendlyAddress[],
        details: domainActionDetailsToTransactionTraceActionDetails(action.type, action.details),
    };
}

function domainActionDetailsToTransactionTraceActionDetails(
    type: string,
    details: Record<string, unknown>,
): TransactionTraceActionDetails {
    if (type === 'jetton_swap') {
        return {
            type: 'jetton_swap',
            value: toTransactionTraceActionJettonSwapDetails(details as unknown as EmulationJettonSwapDetails),
        };
    } else if (type === 'call_contract') {
        return {
            type: 'call_contract',
            value: toTransactionTraceActionCallContractDetails(details as unknown as EmulationCallContractDetails),
        };
    } else if (type === 'ton_transfer') {
        return {
            type: 'ton_transfer',
            value: toTransactionTraceActionTONTransferDetails(details as unknown as EmulationTonTransferDetails),
        };
    } else {
        return { type: 'unknown', value: details };
    }
}

function emulationAddressBookToAddressBook(book: Record<string, DomainEmulationAddressBookEntry>): AddressBook {
    const result: AddressBook = {};
    for (const [, entry] of Object.entries(book)) {
        result[entry.userFriendly] = {
            address: entry.userFriendly,
            domain: entry.domain,
            interfaces: entry.interfaces,
        };
    }
    return result;
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
