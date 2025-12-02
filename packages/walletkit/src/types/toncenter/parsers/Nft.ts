/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressBook, NftItemTransferAction, SimplePreview, StatusAction, toAccount } from '../AccountEvent';
import { ToncenterTraceItem, ToncenterTransaction } from '../emulation';
import { asAddressFriendly, Hex } from '../../primitive';
import { Base64ToHex } from '../../../utils/base64';
import { computeStatus } from './TonTransfer';
import { getDecoded, extractOpFromBody, matchOpWithMap } from './body';
import { OpCode } from './opcodes';

type Json = Record<string, unknown>;

export function parseNftActions(
    ownerFriendly: string,
    item: ToncenterTraceItem,
    addressBook: AddressBook,
): NftItemTransferAction[] {
    const actions: NftItemTransferAction[] = [];
    const txs = item.transactions || {};

    // Sent: find out_msg with decoded '@type' === 'nft_transfer' originating from owner's main wallet
    for (const key of Object.keys(txs)) {
        const tx = txs[key];
        if (asAddressFriendly(tx.account) !== ownerFriendly) continue;
        for (const out of tx.out_msgs || []) {
            const decoded = getDecoded(out);
            if (decoded?.['@type'] === 'nft_transfer') {
                const newOwner = toAddr(getProp(decoded, 'new_owner'));
                const nftAddr = out.destination ? asAddressFriendly(out.destination) : '';
                const status = computeStatus(tx);
                const base = collectBaseTransactionsForSent(item, ownerFriendly, newOwner, nftAddr);
                const action = buildNftAction(status, ownerFriendly, newOwner, nftAddr, addressBook, base);
                actions.push(action);
            }
        }
    }

    // Received: find in_msg with decoded '@type' indicates ownership assignment to ownerFriendly
    for (const key of Object.keys(txs)) {
        const tx = txs[key];
        const acc = asAddressFriendly(tx.account);
        const decoded = getDecoded(tx.in_msg);
        if (!decoded) continue;
        const t = decoded['@type'];
        if (acc === ownerFriendly && (t === 'nft_ownership_assigned' || t === 'nft_owner_changed')) {
            const prevOwner = toAddr(getProp(decoded, 'prev_owner')) || toAddr(getProp(decoded, 'old_owner'));
            const nftAddr = tx.in_msg?.source ? asAddressFriendly(tx.in_msg.source) : '';
            // prefer status from NFT item transaction (child)
            const nftTx = findTransactionByAccount(item, nftAddr);
            const status = nftTx ? computeStatus(nftTx) : computeStatus(tx);
            const base = collectBaseTransactionsForReceived(item, ownerFriendly, nftAddr);
            const action = buildNftAction(status, prevOwner, ownerFriendly, nftAddr, addressBook, base);
            actions.push(action);
        }
    }

    return actions;
}

function buildNftAction(
    status: StatusAction,
    senderFriendly: string,
    recipientFriendly: string,
    nftAddress: string,
    addressBook: AddressBook,
    base: Hex[],
): NftItemTransferAction {
    const preview: SimplePreview = {
        name: 'NFT Transfer',
        description: 'Transferring 1 NFT',
        value: '1 NFT',
        accounts: [
            toAccount(recipientFriendly, addressBook),
            toAccount(senderFriendly, addressBook),
            toContractAccount(nftAddress, addressBook),
        ],
    };
    return {
        type: 'NftItemTransfer',
        id: base[0] || ('' as Hex),
        status,
        NftItemTransfer: {
            sender: toAccount(senderFriendly, addressBook),
            recipient: toAccount(recipientFriendly, addressBook),
            nft: nftAddress,
        },
        simplePreview: preview,
        baseTransactions: base,
    };
}

function collectBaseTransactionsForSent(
    item: ToncenterTraceItem,
    ownerFriendly: string,
    newOwner: string,
    nftAddr: string,
): Hex[] {
    const order = item.transactions_order || [];
    let ownerTonFromNft: Hex | null = null;
    let assignToNewOwner: Hex | null = null;
    let nftTransferHash: Hex | null = null;
    for (const h of order) {
        const tx = item.transactions[h];
        if (!tx) continue;
        const acc = asAddressFriendly(tx.account);
        const t = getNftType(tx);
        if (
            !ownerTonFromNft &&
            acc === ownerFriendly &&
            tx.in_msg?.source &&
            asAddressFriendly(tx.in_msg.source) === nftAddr
        ) {
            ownerTonFromNft = Base64ToHex(h);
        }
        if (
            !assignToNewOwner &&
            acc === asAddressFriendly(newOwner) &&
            (t === 'nft_ownership_assigned' || t === 'nft_owner_changed')
        ) {
            assignToNewOwner = Base64ToHex(h);
        }
        if (!nftTransferHash && acc === nftAddr && t === 'nft_transfer') {
            nftTransferHash = Base64ToHex(h);
        }
    }
    return [ownerTonFromNft, assignToNewOwner, nftTransferHash].filter(Boolean) as Hex[];
}

function getNftType(tx: ToncenterTransaction): string | '' {
    const t = extractOpFromBody(tx.in_msg) || tx.in_msg?.opcode || '';
    return matchOpWithMap(t, ['nft_transfer', 'nft_ownership_assigned', 'nft_owner_changed', 'excess'], {
        [OpCode.NftTransfer]: 'nft_transfer',
        [OpCode.NftOwnershipAssigned]: 'nft_ownership_assigned',
        [OpCode.NftOwnerChanged]: 'nft_owner_changed',
        [OpCode.Excess]: 'excess',
    });
}

function collectBaseTransactionsForReceived(item: ToncenterTraceItem, ownerFriendly: string, nftAddr: string): Hex[] {
    const order = item.transactions_order || [];
    let ownerFromNft: Hex | null = null;
    const outToOwner: Hex[] = [];
    const others: Hex[] = [];
    for (const h of order) {
        const tx = item.transactions[h];
        if (!tx) continue;
        const acc = asAddressFriendly(tx.account);
        if (
            !ownerFromNft &&
            acc === ownerFriendly &&
            tx.in_msg?.source &&
            asAddressFriendly(tx.in_msg.source) === nftAddr
        ) {
            ownerFromNft = Base64ToHex(h);
            continue;
        }
        if (acc !== ownerFriendly) {
            const hex = Base64ToHex(h);
            const targetsOwner = (tx.out_msgs || []).some((m) => asAddressFriendly(m.destination) === ownerFriendly);
            if (targetsOwner) outToOwner.push(hex);
            others.push(hex);
        }
    }
    const firstOther = outToOwner[0] || null;
    const base: Hex[] = [];
    if (firstOther) base.push(firstOther as Hex);
    const second = others.find((h) => h !== firstOther) || null;
    if (second) base.push(second as Hex);
    if (ownerFromNft) base.push(ownerFromNft);
    return base as Hex[];
}

// using shared matchOpWithMap

// using shared extractOpFromBody

function toContractAccount(address: string, addressBook: AddressBook) {
    const acc = toAccount(address, addressBook);
    return { ...acc, isWallet: false };
}

function findTransactionByAccount(item: ToncenterTraceItem, account: string): ToncenterTransaction | null {
    for (const key of Object.keys(item.transactions || {})) {
        const t = item.transactions[key];
        if (t && asAddressFriendly(t.account) === account) return t;
    }
    return null;
}

function toAddr(raw?: unknown): string {
    if (!raw) return '';
    if (typeof raw === 'string') {
        if (/^[A-Fa-f0-9]{64}$/.test(raw)) return asAddressFriendly(`0:${raw}`);
        return asAddressFriendly(raw);
    }
    if (isRecord(raw)) {
        const wc = raw['workchain_id'];
        const addr = raw['address'];
        if ((typeof wc === 'string' || typeof wc === 'number') && typeof addr === 'string') {
            return asAddressFriendly(`${wc}:${addr}`);
        }
    }
    return '';
}

function isRecord(v: unknown): v is Json {
    return typeof v === 'object' && v !== null;
}

function getProp(obj: unknown, key: string): unknown {
    return isRecord(obj) ? obj[key] : undefined;
}
