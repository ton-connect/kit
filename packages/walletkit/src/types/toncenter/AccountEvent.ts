/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { EmulationAddressBookEntry, EmulationTraceNode, ToncenterTraceItem, ToncenterTransaction } from './emulation';
import { AddressFriendly, asAddressFriendly, Hex } from '../primitive';
import { Base64ToHex } from '../../utils/base64';
import { computeStatus, parseIncomingTonTransfers, parseOutgoingTonTransfers } from './parsers/TonTransfer';
import { parseContractActions } from './parsers/Contract';
import { parseJettonActions } from './parsers/Jetton';
import { parseNftActions } from './parsers/Nft';

export interface AddressBookItem {
    domain?: string;
    isScam?: boolean;
    isWallet?: boolean;
}

export type AddressBook = Record<AddressFriendly, AddressBookItem>;

export function toAddressBook(data: Record<string, EmulationAddressBookEntry>): AddressBook {
    const out: AddressBook = {};
    for (const item of Object.keys(data)) {
        const domain = data[item].domain;
        if (domain) {
            out[asAddressFriendly(item)] = { domain } as AddressBookItem;
        }
    }
    return out;
}

export interface Event {
    eventId: Hex;
    account: Account;
    timestamp: number;
    actions: Action[];
    isScam: boolean;
    lt: number;
    inProgress: boolean;
    trace: EmulationTraceNode;
    transactions: Record<string, ToncenterTransaction>;
}

export type StatusAction = 'success' | 'failure';

export interface TypedAction {
    type: string;
    id: Hex;
    status: StatusAction;
    simplePreview: SimplePreview;
    baseTransactions: Hex[];
}

export interface TonTransferAction extends TypedAction {
    type: 'TonTransfer';
    TonTransfer: TonTransfer;
}

export interface SmartContractExecAction extends TypedAction {
    type: 'SmartContractExec';
    SmartContractExec: SmartContractExec;
}

export interface SmartContractExec {
    executor: Account;
    contract: Account;
    tonAttached: bigint;
    operation: string;
    payload: string;
}

export interface JettonSwapAction extends TypedAction {
    type: 'JettonSwap';
    JettonSwap: JettonSwap;
}
export interface JettonTransferAction extends TypedAction {
    type: 'JettonTransfer';
    JettonTransfer: JettonTransfer;
}

export interface NftItemTransferAction extends TypedAction {
    type: 'NftItemTransfer';
    NftItemTransfer: {
        sender: Account;
        recipient: Account;
        nft: string; // NFT item address
    };
}

export interface JettonTransfer {
    sender: Account;
    recipient: Account;
    sendersWallet: string;
    recipientsWallet: string;
    amount: bigint;
    comment?: string;
    jetton: JettonMasterOut;
}

export interface JettonSwap {
    dex: string;
    amountIn: string;
    amountOut: string;
    tonIn: number;
    userWallet: Account;
    router: Account;
    jettonMasterOut: JettonMasterOut;
}

export interface JettonMasterOut {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    verification: string;
    score: number;
}

export interface ContractDeployAction extends TypedAction {
    type: 'ContractDeploy';
    ContractDeploy: {
        address: string;
        interfaces: string[];
    };
}

export type Action =
    | TypedAction
    | TonTransferAction
    | SmartContractExecAction
    | JettonTransferAction
    | NftItemTransferAction
    | ContractDeployAction
    | JettonSwapAction;

export function toEvent(data: ToncenterTraceItem, account: string, addressBook: AddressBook = {}): Event {
    const actions: Action[] = [];
    const accountFriendly = asAddressFriendly(account);
    const transactions: Record<string, ToncenterTransaction> = data.transactions || {};
    for (const txHash of Object.keys(transactions)) {
        const tx = transactions[txHash];
        const txAccount = asAddressFriendly(tx.account);
        if (txAccount !== accountFriendly) {
            continue;
        }
        const status = computeStatus(tx);
        actions.push(
            ...parseOutgoingTonTransfers(tx, addressBook, status),
            ...parseIncomingTonTransfers(tx, addressBook, status),
        );
    }
    // Smart-contract related actions (exec + deploy)
    actions.push(...parseContractActions(accountFriendly, transactions, addressBook));
    // Jetton transfers (sent/received)
    actions.push(...parseJettonActions(accountFriendly, data, addressBook));
    // NFT transfers (sent/received)
    actions.push(...parseNftActions(accountFriendly, data, addressBook));

    // If jetton actions exist, drop TonTransfer/SmartContractExec noise tied to same flow
    const hasJetton = actions.some((a) => a.type === 'JettonTransfer');
    const hasNft = actions.some((a) => a.type === 'NftItemTransfer');
    if (hasJetton || hasNft) {
        const keepTypes: string[] = hasJetton ? ['JettonTransfer'] : ['NftItemTransfer'];
        let filtered: Action[] = actions.filter((a) => keepTypes.includes(a.type));
        if (hasNft && !hasJetton) {
            // Drop id field from NFT actions to match expected output shape
            filtered = filtered.map((a) => {
                if (a.type !== 'NftItemTransfer') return a;
                const nft = a as NftItemTransferAction;
                const out: Omit<NftItemTransferAction, 'id'> = {
                    type: 'NftItemTransfer',
                    status: nft.status,
                    NftItemTransfer: nft.NftItemTransfer,
                    simplePreview: nft.simplePreview,
                    baseTransactions: nft.baseTransactions,
                };
                return out as unknown as Action;
            });
        }
        return {
            eventId: Base64ToHex(data.trace_id),
            account: toAccount(account, addressBook),
            timestamp: data.start_utime,
            actions: filtered,
            isScam: false,
            lt: Number(data.start_lt),
            inProgress: data.is_incomplete,
            trace: data.trace,
            transactions: data.transactions,
        };
    }
    return {
        eventId: Base64ToHex(data.trace_id),
        account: toAccount(account, addressBook),
        timestamp: data.start_utime,
        actions,
        isScam: false, // TODO implement detect isScam for Event
        lt: Number(data.start_lt),
        inProgress: data.is_incomplete,
        trace: data.trace,
        transactions: data.transactions,
    };
}

export interface TonTransfer {
    sender: Account;
    recipient: Account;
    amount: bigint;
    comment?: string;
}

export interface SimplePreview {
    name: string;
    description: string;
    value: string;
    accounts: Account[];
    valueImage?: string;
}

export interface Account {
    address: string;
    name?: string;
    isScam: boolean;
    isWallet: boolean;
}

export function toAccount(address: string, addressBook: AddressBook): Account {
    const out: Account = {
        address: asAddressFriendly(address),
        isScam: false,
        isWallet: true,
    };
    const record = addressBook[asAddressFriendly(address)];
    if (record) {
        if (record.isScam) {
            out.isScam = record.isScam;
        }
        if (record.isWallet) {
            out.isWallet = record.isWallet;
        }
        if (record.domain) {
            out.name = record.domain;
        }
    }
    return out;
}
