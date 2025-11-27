/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    EmulationTraceNode,
    ToncenterEmulationResponse,
    ToncenterTraceItem,
    ToncenterTransaction,
    EmulationTokenInfoMasters,
    EmulationTokenInfoWallets,
} from './emulation';
import { AddressFriendly, asAddressFriendly, asMaybeAddressFriendly, Hex } from '../primitive';
import { Base64ToHex } from '../../utils/base64';
import { computeStatus, parseIncomingTonTransfers, parseOutgoingTonTransfers } from './parsers/TonTransfer';
import { parseContractActions } from './parsers/Contract';
import { parseJettonActions } from './parsers/Jetton';
import { parseNftActions } from './parsers/Nft';
import { MetadataV3 } from './v3/AddressBookRowV3';

export interface JettonMasterInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    verification: string;
    score: number;
}

export interface JettonWalletInfo {
    balance: string;
    jettonMaster: string;
    owner: string;
}

export interface AddressBookItem {
    domain?: string;
    isScam?: boolean;
    isWallet?: boolean;
    jetton?: JettonMasterInfo;
    jettonWallet?: JettonWalletInfo;
}

export type AddressBook = Record<AddressFriendly, AddressBookItem>;

export function toAddressBook(data: MetadataV3): AddressBook {
    const out: AddressBook = {};

    // Process address_book for domain information
    for (const [address, bookRow] of Object.entries(data.address_book)) {
        const friendly = asAddressFriendly(address);
        if (bookRow.domain) {
            out[friendly] = { domain: bookRow.domain };
        }
        // Check if address is a wallet by looking for "wallet" in interfaces
        if (bookRow.interfaces && Array.isArray(bookRow.interfaces)) {
            const hasWalletInterface = bookRow.interfaces.some(
                (iface) => typeof iface === 'string' && iface.toLowerCase().includes('wallet'),
            );
            if (hasWalletInterface) {
                if (!out[friendly]) {
                    out[friendly] = {};
                }
                out[friendly].isWallet = true;
            }
        }
    }

    // Process metadata for jetton information
    for (const [address, meta] of Object.entries(data.metadata)) {
        const friendly = asAddressFriendly(address);
        if (!out[friendly]) {
            out[friendly] = {};
        }

        if (!meta.token_info) continue;

        for (const tokenInfo of meta.token_info) {
            if (tokenInfo.type === 'jetton_masters') {
                const masterInfo = tokenInfo as EmulationTokenInfoMasters;
                const decimals = masterInfo.extra?.decimals ? parseInt(masterInfo.extra.decimals, 10) : 0;
                const image =
                    masterInfo.image ||
                    masterInfo.extra?._image_small ||
                    masterInfo.extra?._image_medium ||
                    masterInfo.extra?._image_big ||
                    '';

                out[friendly].jetton = {
                    address: friendly,
                    name: masterInfo.name || '',
                    symbol: masterInfo.symbol || '',
                    decimals,
                    image,
                    verification: 'whitelist',
                    score: 100,
                };
            } else if (tokenInfo.type === 'jetton_wallets') {
                const walletInfo = tokenInfo as EmulationTokenInfoWallets;
                out[friendly].jettonWallet = {
                    balance: walletInfo.extra?.balance || '0',
                    jettonMaster: asAddressFriendly(walletInfo.extra?.jetton || ''),
                    owner: asAddressFriendly(walletInfo.extra?.owner || ''),
                };
            }
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

/**
 * Helper: Build Event structure from parsed data
 */
function buildEvent(data: ToncenterTraceItem, account: string, actions: Action[], addressBook: AddressBook): Event {
    return {
        eventId: Base64ToHex(data.trace_id),
        account: toAccount(account, addressBook),
        timestamp: data.start_utime,
        actions,
        isScam: false,
        lt: Number(data.start_lt),
        inProgress: data.is_incomplete,
        trace: data.trace,
        transactions: data.transactions,
    };
}

/**
 * Helper: Filter actions based on priority (Jetton/NFT take precedence over TON transfers)
 */
function filterActionsByPriority(actions: Action[]): Action[] {
    const hasJetton = actions.some((a) => a.type === 'JettonTransfer');
    const hasNft = actions.some((a) => a.type === 'NftItemTransfer');

    // If high-priority actions exist, filter out low-level TON transfer noise
    if (hasJetton || hasNft) {
        const keepTypes = hasJetton ? ['JettonTransfer'] : ['NftItemTransfer'];
        return actions.filter((a) => keepTypes.includes(a.type));
    }

    return actions;
}

/**
 * Parse trace item into structured Event with typed actions
 */
export function toEvent(data: ToncenterTraceItem, account: string, addressBook: AddressBook = {}): Event {
    const accountFriendly = asAddressFriendly(account);
    const transactions: Record<string, ToncenterTransaction> = data.transactions || {};
    const actions: Action[] = [];

    // Parse TON transfers from owner's transactions
    for (const txHash of Object.keys(transactions)) {
        const tx = transactions[txHash];
        if (asAddressFriendly(tx.account) !== accountFriendly) {
            continue;
        }
        const status = computeStatus(tx);
        actions.push(
            ...parseOutgoingTonTransfers(tx, addressBook, status),
            ...parseIncomingTonTransfers(tx, addressBook, status),
        );
    }

    // Parse contract interactions, jettons, and NFTs
    actions.push(
        ...parseContractActions(accountFriendly, transactions, addressBook),
        ...parseJettonActions(accountFriendly, data, addressBook),
        ...parseNftActions(accountFriendly, data, addressBook),
    );

    // Filter by priority: Jetton/NFT actions hide underlying TON transfers
    const filteredActions = filterActionsByPriority(actions);

    return buildEvent(data, account, filteredActions, addressBook);
}

export function emulationEvent(data: ToncenterEmulationResponse, account?: string): Event {
    // Build a ToncenterTraceItem from emulation response
    const txEntries = Object.entries(data.transactions) as [string, ToncenterTransaction][];
    const byLtAsc = [...txEntries].sort((a, b) => (BigInt(a[1].lt) < BigInt(b[1].lt) ? -1 : 1));
    const transactions_order = byLtAsc.map(([hash]) => hash);

    const start_lt = byLtAsc[0]?.[1].lt ?? '0';
    const end_lt = byLtAsc[byLtAsc.length - 1]?.[1].lt ?? '0';
    const start_utime =
        byLtAsc.length > 0 ? Math.min(...byLtAsc.map(([, tx]) => tx.now)) : Math.floor(Date.now() / 1000);
    const end_utime = byLtAsc.length > 0 ? Math.max(...byLtAsc.map(([, tx]) => tx.now)) : start_utime;
    const mcSeqnos = byLtAsc.map(([, tx]) => tx.mc_block_seqno);
    const mc_seqno_start = mcSeqnos.length > 0 ? String(Math.min(...mcSeqnos)) : '0';
    const mc_seqno_end = mcSeqnos.length > 0 ? String(Math.max(...mcSeqnos)) : '0';
    const trace_id = transactions_order[0] ?? '';
    const rootTx = trace_id ? data.transactions[trace_id] : undefined;
    const external_hash =
        ((rootTx?.in_msg as unknown as { hash_norm?: string })?.hash_norm as string | undefined) ||
        ((rootTx?.in_msg as unknown as { hash?: string })?.hash as string | undefined) ||
        '';

    const traceItem: ToncenterTraceItem = {
        actions: data.actions,
        end_lt,
        end_utime,
        external_hash,
        is_incomplete: data.is_incomplete,
        mc_seqno_end,
        mc_seqno_start,
        start_lt,
        start_utime,
        trace: data.trace,
        trace_id,
        trace_info: {
            classification_state: 'emulated',
            messages: byLtAsc.reduce((sum, [, tx]) => sum + (tx.in_msg ? 1 : 0) + (tx.out_msgs?.length ?? 0), 0),
            pending_messages: 0,
            trace_state: 'complete',
            transactions: transactions_order.length,
        },
        transactions: data.transactions,
        transactions_order,
        warning: '',
    };
    // Provide metadata for parsers that utilize it (jettons/NFTs)
    (traceItem as unknown as { metadata?: Record<string, unknown> }).metadata = data.metadata as unknown as Record<
        string,
        unknown
    >;

    // Infer primary account as the account of the root transaction,
    // or fall back to the first transaction's account, or an explicitly provided account
    let inferredAccount = account && String(account).trim() ? String(account).trim() : undefined;
    if (!inferredAccount) {
        inferredAccount = rootTx?.account;
    }
    if (!inferredAccount) {
        inferredAccount =
            byLtAsc[0]?.[1]?.account ?? (Object.values(data.transactions || {})[0]?.account as string | undefined);
    }
    if (!inferredAccount) {
        // As a last resort, pass empty to toEvent (it will likely fail to parse addresses),
        // but we try to keep function total. Better: return minimal event with no actions.
        // However, to keep consistent use-sites, prefer empty string here and let toEvent handle.
        inferredAccount = '';
    }
    const addressBook = toAddressBook(data);
    return toEvent(traceItem, inferredAccount, addressBook);
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
    const friendly = asMaybeAddressFriendly(address);
    const out: Account = {
        address: friendly ?? address ?? '',
        isScam: false,
        isWallet: Boolean(friendly),
    };
    if (friendly) {
        const record = addressBook[friendly];
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
    }
    return out;
}
