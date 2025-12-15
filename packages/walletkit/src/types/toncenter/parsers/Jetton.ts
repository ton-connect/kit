/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    toAccount,
    AddressBook,
    Account,
    Action,
    StatusAction,
    JettonTransferAction,
    SimplePreview,
} from '../AccountEvent';
import { ToncenterTraceItem, ToncenterTransaction } from '../emulation';
import { asAddressFriendly } from '../../primitive';
import { Base64ToHex } from '../../../utils/base64';
import { getDecoded, extractOpFromBody, matchOpWithMap } from './body';
import { OpCode } from './opcodes';
import { Hex } from '../../../api/models';

//
// This parser has been refactored with new architecture support
// Legacy function maintained for backwards compatibility
// New handlers available in ./handlers/JettonHandler.ts

export function parseJettonActions(
    ownerFriendly: string,
    item: ToncenterTraceItem,
    addressBook: AddressBook,
): Action[] {
    const actions: Action[] = [];
    const txs = item.transactions || {};
    let added = false;

    // Sent: jetton_transfer originates from owner's main wallet → owner's jetton wallet
    for (const key of Object.keys(txs)) {
        const tx = txs[key];
        const inMsg = tx.in_msg;
        const decoded = getDecoded(inMsg);
        if (!decoded) continue;
        if (
            decoded['@type'] === 'jetton_transfer' &&
            inMsg?.source &&
            asAddressFriendly(inMsg.source) === ownerFriendly
        ) {
            const amount = toBigInt(readAmountValue(getProp(decoded, 'amount')));
            const dest = toAddr(getProp(decoded, 'destination'));
            const comment = extractCommentFromDecoded(getForwardPayloadValue(decoded)) ?? undefined;
            const senderWallet = asAddressFriendly(tx.account);
            const recipientWallet = findRecipientJettonWalletFromOut(tx);

            const status = computeStatus(tx);
            const id = (findFirstOwnerTxId(ownerFriendly, item) ?? Base64ToHex(tx.hash)) as Hex;
            const base = collectBaseTransactionsSent(item, ownerFriendly);
            const jetton = buildJettonInfo(item, senderWallet, addressBook);

            const action: JettonTransferAction = {
                type: 'JettonTransfer',
                id,
                status,
                JettonTransfer: {
                    sender: toAccount(ownerFriendly, addressBook),
                    recipient: toAccount(dest, addressBook),
                    sendersWallet: senderWallet,
                    recipientsWallet: recipientWallet ?? '',
                    amount,
                    comment,
                    jetton,
                },
                simplePreview: jettonPreview(amount, jetton.symbol, jetton.decimals, jetton.image, [
                    toAccount(dest, addressBook),
                    toAccount(ownerFriendly, addressBook),
                    toContractAccount(
                        jetton.address || inferMinterFromAddressBook(addressBook)?.address || '',
                        addressBook,
                    ),
                ]),
                baseTransactions: base as Hex[],
            };
            actions.push(action);
            added = true;
        }
    }

    // Received (only if not added above): jetton_internal_transfer goes to owner's jetton wallet, then jetton_notify to owner's main
    if (!added)
        for (const key of Object.keys(txs)) {
            const tx = txs[key];
            if (asAddressFriendly(tx.account) === ownerFriendly) continue; // skip main wallet tx here
            const inMsg = tx.in_msg;
            const decoded = getDecoded(inMsg);
            if (!decoded) continue;
            if (decoded['@type'] === 'jetton_internal_transfer') {
                const amount = toBigInt(readAmountValue(getProp(decoded, 'amount')));
                const senderMain = toAddr(getProp(decoded, 'from'));
                const recipientWallet = asAddressFriendly(tx.account);
                const senderWallet = asAddressFriendly(inMsg!.source!);

                const status = computeStatus(tx);
                const id = (getTraceRootId(item) ?? Base64ToHex(tx.hash)) as Hex;
                const base = collectBaseTransactionsReceived(item, ownerFriendly);
                const jetton = buildJettonInfo(item, recipientWallet, addressBook);

                const action: JettonTransferAction = {
                    type: 'JettonTransfer',
                    id,
                    status,
                    JettonTransfer: {
                        sender: toAccount(senderMain, addressBook),
                        recipient: toAccount(ownerFriendly, addressBook),
                        sendersWallet: senderWallet,
                        recipientsWallet: recipientWallet,
                        amount,
                        jetton,
                    },
                    simplePreview: jettonPreview(amount, jetton.symbol, jetton.decimals, jetton.image, [
                        toAccount(ownerFriendly, addressBook),
                        toAccount(senderMain, addressBook),
                        toContractAccount(
                            jetton.address || inferMinterFromAddressBook(addressBook)?.address || '',
                            addressBook,
                        ),
                    ]),
                    baseTransactions: base as Hex[],
                };
                actions.push(action);
                added = true;
            }
        }

    return actions;
}

function extractCommentFromDecoded(decoded?: unknown): string | null {
    if (!isRecord(decoded)) return null;
    const t = decoded['@type'];
    if (t === 'text_comment') {
        const txt = decoded['text'];
        if (typeof txt === 'string' && txt.length > 0) return txt;
    }
    return null;
}

function toBigInt(value?: string | number): bigint {
    if (value === undefined || value === null) return BigInt(0);
    const n = typeof value === 'string' ? Number(value) : value;
    return BigInt(Number.isFinite(n) ? n : 0);
}

function toAddr(raw?: unknown): string {
    if (!raw) return '';
    if (typeof raw === 'string') {
        // Friendly or raw hex without wc
        if (/^[A-Fa-f0-9]{64}$/.test(raw)) {
            return asAddressFriendly(`0:${raw}`);
        }
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

function jettonPreview(
    amount: bigint,
    symbol: string,
    decimals: number,
    image: string | undefined,
    accounts: Account[],
): SimplePreview {
    let denom = BigInt(1);
    for (let i = 0; i < (decimals || 0); i++) denom = denom * BigInt(10);
    const value = Number(amount) / Number(denom);
    const human = symbol ? `${trimAmount(value)} ${symbol}` : `${trimAmount(value)}`;
    const preview: SimplePreview = {
        name: 'Jetton Transfer',
        description: `Transferring ${human}`,
        value: human,
        accounts,
    };
    if (image) (preview as SimplePreview).valueImage = image;
    return preview;
}

function computeStatus(tx: ToncenterTransaction): StatusAction {
    const aborted = Boolean(tx.description?.aborted);
    const computePh = (tx.description as unknown as Record<string, unknown>)?.['compute_ph'] as
        | Record<string, unknown>
        | undefined;
    const action = (tx.description as unknown as Record<string, unknown>)?.['action'] as
        | Record<string, unknown>
        | undefined;
    const computeSuccess = Boolean(computePh && Boolean(computePh['success']));
    const actionSuccess = Boolean(action && Boolean(action['success']));
    return !aborted && computeSuccess && actionSuccess ? 'success' : 'failure';
}

function findFirstOwnerTxId(ownerFriendly: string, item: ToncenterTraceItem): Hex | null {
    for (const h of item.transactions_order || []) {
        const tx = item.transactions[h];
        if (tx && asAddressFriendly(tx.account) === ownerFriendly) {
            return Base64ToHex(h);
        }
    }
    return null;
}

function getTraceRootId(item: ToncenterTraceItem): Hex | null {
    const first = (item.transactions_order || [])[0];
    return first ? Base64ToHex(first) : null;
}

function findRecipientJettonWalletFromOut(tx: ToncenterTransaction): string | null {
    for (const m of tx.out_msgs || []) {
        const d = getDecoded(m) as Record<string, unknown> | null;
        if (m.opcode === OpCode.JettonInternalTransfer || (d && d['@type'] === 'jetton_internal_transfer')) {
            return asAddressFriendly(m.destination);
        }
    }
    return null;
}

function collectBaseTransactionsSent(item: ToncenterTraceItem, ownerFriendly: string): Hex[] {
    const order = item.transactions_order || [];
    const pairs: { type: string; hex: Hex }[] = [];
    for (const h of order) {
        const tx = item.transactions[h];
        if (!tx) continue;
        if (asAddressFriendly(tx.account) === ownerFriendly) continue; // skip owner main
        const t = getTxType(tx);
        if (t) pairs.push({ type: t, hex: Base64ToHex(h) });
    }
    const priority: Record<string, number> = {
        jetton_transfer: 1,
        jetton_notify: 2,
        jetton_internal_transfer: 3,
        excess: 4,
    };
    pairs.sort((a, b) => (priority[a.type] ?? 99) - (priority[b.type] ?? 99));
    return pairs.map((p) => p.hex);
}

function collectBaseTransactionsReceived(item: ToncenterTraceItem, ownerFriendly: string): Hex[] {
    const order = item.transactions_order || [];
    const findTx = (predicate: (tx: ToncenterTransaction) => boolean): Hex | null => {
        for (const h of order) {
            const tx = item.transactions[h];
            if (!tx) continue;
            if (predicate(tx)) return Base64ToHex(h);
        }
        return null;
    };
    const root = getTraceRootId(item);
    const isType = (tx: ToncenterTransaction, type: string) => getTxType(tx) === type;
    const jt = findTx((tx) => isType(tx, 'jetton_transfer'));
    const internal = findTx(
        (tx) => isType(tx, 'jetton_internal_transfer') && asAddressFriendly(tx.account) !== ownerFriendly,
    );
    const excess = findTx((tx) => isType(tx, 'excess'));
    const out: Hex[] = [];
    if (root) out.push(root);
    if (jt) out.push(jt);
    if (internal) out.push(internal);
    if (excess) out.push(excess);
    return out;
}

function getTxType(tx: ToncenterTransaction): string | '' {
    const fromBody = extractOpFromBody(tx.in_msg);
    return matchOpWithMap(
        fromBody || tx.in_msg?.opcode || '',
        ['jetton_transfer', 'jetton_internal_transfer', 'jetton_notify', 'excess'],
        {
            [OpCode.JettonTransfer]: 'jetton_transfer',
            [OpCode.JettonInternalTransfer]: 'jetton_internal_transfer',
            [OpCode.JettonNotify]: 'jetton_notify',
            [OpCode.Excess]: 'excess',
        },
    );
}

// using shared extractOpFromBody

function buildJettonInfo(
    item: ToncenterTraceItem,
    walletFriendly: string,
    addressBook: AddressBook,
): {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    verification: string;
    score: number;
} {
    // First, try to find jetton info directly from addressBook using wallet address
    const walletInfo = addressBook[walletFriendly];
    if (walletInfo?.jettonWallet?.jettonMaster) {
        const masterAddress = walletInfo.jettonWallet.jettonMaster;
        const masterInfo = addressBook[masterAddress];
        if (masterInfo?.jetton) {
            return masterInfo.jetton;
        }
    }

    // Fallback: scan metadata if addressBook doesn't have complete info
    const metadata = (item as unknown as { metadata?: Record<string, unknown> }).metadata;
    let master: string | undefined;
    if (metadata) {
        for (const [raw, infoAny] of Object.entries(metadata)) {
            const info = infoAny as Record<string, unknown>;
            const tokenInfo = info['token_info'];
            if (!Array.isArray(tokenInfo)) continue;
            for (const tAny of tokenInfo) {
                const t = tAny as Record<string, unknown>;
                if (t['type'] === 'jetton_wallets') {
                    const extra = t['extra'] as Record<string, unknown> | undefined;
                    const owner = extra?.['owner'];
                    if (
                        typeof owner === 'string' &&
                        asAddressFriendly(owner) &&
                        asAddressFriendly(raw) === walletFriendly
                    ) {
                        const j = extra?.['jetton'];
                        if (typeof j === 'string') master = j;
                    }
                }
            }
        }
    }
    let name = '';
    let symbol = '';
    let decimals = 0;
    let image: string | undefined;
    if (master && metadata && metadata[master]) {
        const m = metadata[master] as Record<string, unknown>;
        name = (m['name'] as string) || '';
        symbol = (m['symbol'] as string) || '';
        const extra = m['extra'] as Record<string, unknown> | undefined;
        const dec = extra?.['decimals'];
        decimals = typeof dec === 'string' ? parseInt(dec, 10) : 0;
        image =
            (m['image'] as string) ||
            (extra?.['_image_small'] as string) ||
            (extra?.['_image_medium'] as string) ||
            (extra?.['_image_big'] as string);
    }
    let outAddress = master ? asAddressFriendly(master) : '';
    if (!outAddress) {
        // Fallback: try infer from addressBook by known minter domain
        const inferred = inferMinterFromAddressBook(addressBook);
        if (inferred) {
            outAddress = inferred.address;
            if (!name) name = inferred.name;
            if (!symbol) symbol = inferred.symbol;
            if (!decimals) decimals = inferred.decimals;
            if (!image) image = inferred.image;
        }
    }
    return {
        address: outAddress,
        name,
        symbol,
        decimals,
        image: image ?? '',
        verification: 'whitelist',
        score: 100,
    };
}

function toContractAccount(address: string, addressBook: AddressBook): Account {
    const acct = toAccount(address, addressBook);
    return { ...acct, isWallet: false };
}

function inferMinterFromAddressBook(addressBook: AddressBook): {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
} | null {
    // Heuristic: find known USDT minter
    const knownMinterByDomain = 'usdt-minter.ton';
    for (const key of Object.keys(addressBook)) {
        const entry = (addressBook as Record<string, { domain?: string }>)[key];
        const domain = entry && entry.domain;
        if (domain === knownMinterByDomain || (typeof domain === 'string' && domain.includes('minter'))) {
            return {
                address: key,
                name: 'Tether USD',
                symbol: 'USD₮',
                decimals: 6,
                image: 'https://cache.tonapi.io/imgproxy/T3PB4s7oprNVaJkwqbGg54nexKE0zzKhcrPv8jcWYzU/rs:fill:200:200:1/g:no/aHR0cHM6Ly90ZXRoZXIudG8vaW1hZ2VzL2xvZ29DaXJjbGUucG5n.webp',
            };
        }
    }
    return null;
}

function trimAmount(v: number): string {
    if (v >= 1) return `${Number(v.toFixed(3)).toString().replace(/\.0+$/, '')}`;
    // keep up to 9 decimals for small values
    const s = v.toFixed(9);
    return s.replace(/0+$/, '').replace(/\.$/, '');
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

function getProp(obj: unknown, key: string): unknown {
    return isRecord(obj) ? obj[key] : undefined;
}

function readAmountValue(obj: unknown): string | number | undefined {
    if (!isRecord(obj)) return undefined;
    const v = obj['value'];
    if (typeof v === 'string' || typeof v === 'number') return v;
    return undefined;
}

function getForwardPayloadValue(decoded: unknown): unknown {
    const fp = getProp(decoded, 'forward_payload');
    return isRecord(fp) ? fp['value'] : undefined;
}
