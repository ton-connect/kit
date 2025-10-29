import { fromNano } from '@ton/core';

import {
    EmulationAction,
    EmulationAddressBookEntry,
    EmulationTonTransferDetails,
    ToncenterTraceItem,
    ToncenterTransaction,
} from './emulation';
import { AddressFriendly, asAddressFriendly, Hex } from '../primitive';
import { Base64ToHex } from '../../utils/base64';
import { computeStatus, parseIncomingTonTransfers, parseOutgoingTonTransfers } from './parsers/TonTransfer';
import { parseContractActions } from './parsers/Contract';

export type AddressBook = Record<AddressFriendly, string>;

export function toAddressBook(data: Record<string, EmulationAddressBookEntry>): AddressBook {
    const out: Record<AddressFriendly, string> = {};
    for (const item of Object.keys(data)) {
        const domain = data[item].domain;
        if (domain) {
            out[asAddressFriendly(item)] = domain;
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
    return {
        eventId: Base64ToHex(data.trace_id),
        account: toAccount(account, addressBook),
        timestamp: data.start_utime,
        actions,
        isScam: false, // TODO implement detect isScam for Event
        lt: Number(data.start_lt),
        inProgress: data.is_incomplete,
        transactions: data.transactions,
    };
}

export function toAction(data: EmulationAction, addressBook: AddressBook = {}): Action {
    switch (data.type) {
        case 'ton_transfer':
            return createTonTransferAction(data, addressBook);
        case 'jetton_mint': // TODO jetton_mint
        default:
            return createDefaultAction(data, addressBook);
    }
}

export function createDefaultAction(data: EmulationAction, addressBook: AddressBook = {}): TypedAction {
    return {
        type: 'Unknown',
        id: Base64ToHex(data.action_id),
        status: data.success ? 'success' : 'failure',
        simplePreview: {
            name: 'Unknown',
            description: 'Transferring unknown',
            value: 'unknown',
            accounts: (data.accounts || []).map((item) => {
                return toAccount(item, addressBook);
            }),
        },
        baseTransactions: data.transactions.map(Base64ToHex),
    };
}

export function createTonTransferAction(data: EmulationAction, addressBook: AddressBook = {}): TonTransferAction {
    const details = data.details as EmulationTonTransferDetails;
    return {
        type: 'TonTransfer',
        id: Base64ToHex(data.action_id),
        status: data.success ? 'success' : 'failure',
        TonTransfer: {
            sender: toAccount(details.source, addressBook),
            recipient: toAccount(details.destination, addressBook),
            amount: BigInt(details.value),
            comment: details.comment ? details.comment : undefined,
        },
        simplePreview: {
            name: 'Ton Transfer',
            description: `Transferring ${fromNano(details.value)} TON`,
            value: `${fromNano(details.value)} TON`,
            accounts: (data.accounts || []).map((item) => {
                return toAccount(item, addressBook);
            }),
        },
        baseTransactions: data.transactions.map(Base64ToHex),
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
        isScam: false, // TODO implement detect isScam for Account
        isWallet: true, // TODO implement detect isWallet for Account
    };
    const name = addressBook[asAddressFriendly(address)] as string | undefined;
    if (name) {
        out.name = name;
    }
    return out;
}
