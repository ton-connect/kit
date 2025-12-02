/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Jetton message handler
 * Processes jetton transfer and internal transfer messages
 */

import { BaseMessageHandler, MessageHandlerContext } from '../messageHandler';
import { MessageType } from '../opcodes';
import { DecodedMessage } from '../messageDecoder';
import {
    Action,
    JettonTransferAction,
    toAccount,
    StatusAction,
    SimplePreview,
    Account,
    AddressBook,
} from '../../AccountEvent';
import { ToncenterTraceItem, ToncenterTransaction } from '../../emulation';
import { asAddressFriendly, Hex } from '../../../primitive';
import { Base64ToHex } from '../../../../utils/base64';

/**
 * Jetton Transfer Handler
 */
export class JettonTransferHandler extends BaseMessageHandler {
    messageType = MessageType.JettonTransfer;
    priority = 10;

    canHandle(message: DecodedMessage, context: MessageHandlerContext): boolean {
        // Check if this is an outgoing jetton transfer from owner
        const inMsg = this.findMessageInTransaction(message, context);
        if (!inMsg) return false;

        return inMsg.source !== undefined && asAddressFriendly(inMsg.source) === context.ownerAddress;
    }

    handle(message: DecodedMessage, context: MessageHandlerContext): Action[] {
        const tx = this.findTransactionForMessage(message, context);
        if (!tx) return [];

        const payload = message.payload as Record<string, unknown>;
        const amount = this.toBigInt(this.readAmountValue(this.getProperty(payload, 'amount')));
        const dest = this.toAddr(this.getProperty(payload, 'destination'));
        const forwardPayload = this.getProperty(payload, 'forward_payload');
        const forwardValue = this.isRecord(forwardPayload) ? forwardPayload['value'] : undefined;
        const comment = this.extractComment(forwardValue) ?? undefined;

        const senderWallet = asAddressFriendly(tx.account);
        const recipientWallet = this.findRecipientJettonWalletFromOut(tx);

        const status = this.computeStatus(tx);
        const id = (this.findFirstOwnerTxId(context) ?? Base64ToHex(tx.hash)) as Hex;
        const base = this.collectBaseTransactionsSent(context);
        const jetton = this.buildJettonInfo(context, senderWallet);

        const action: JettonTransferAction = {
            type: 'JettonTransfer',
            id,
            status,
            JettonTransfer: {
                sender: toAccount(context.ownerAddress, context.addressBook),
                recipient: toAccount(dest, context.addressBook),
                sendersWallet: senderWallet,
                recipientsWallet: recipientWallet ?? '',
                amount,
                comment,
                jetton,
            },
            simplePreview: this.jettonPreview(amount, jetton.symbol, jetton.decimals, jetton.image, [
                toAccount(dest, context.addressBook),
                toAccount(context.ownerAddress, context.addressBook),
                this.toContractAccount(
                    jetton.address || this.inferMinterFromAddressBook(context.addressBook)?.address || '',
                    context.addressBook,
                ),
            ]),
            baseTransactions: base as Hex[],
        };

        return [action];
    }

    private findMessageInTransaction(
        message: DecodedMessage,
        context: MessageHandlerContext,
    ): { source?: string } | null {
        for (const tx of Object.values(context.transactions)) {
            if (tx.in_msg && this.messageMatches(tx.in_msg, message.rawMessage)) {
                // Convert null to undefined for type compatibility
                return {
                    ...tx.in_msg,
                    source: tx.in_msg.source ?? undefined,
                };
            }
        }
        return null;
    }

    private findTransactionForMessage(
        message: DecodedMessage,
        context: MessageHandlerContext,
    ): ToncenterTransaction | null {
        for (const tx of Object.values(context.transactions)) {
            if (tx.in_msg && this.messageMatches(tx.in_msg, message.rawMessage)) {
                return tx;
            }
        }
        return null;
    }

    private messageMatches(msg1: unknown, msg2: unknown): boolean {
        // Simple comparison - can be enhanced
        return msg1 === msg2;
    }

    private readAmountValue(obj: unknown): string | number | undefined {
        if (!this.isRecord(obj)) return undefined;
        const v = obj['value'];
        if (typeof v === 'string' || typeof v === 'number') return v;
        return undefined;
    }

    private toAddr(raw?: unknown): string {
        if (!raw) return '';
        if (typeof raw === 'string') {
            if (/^[A-Fa-f0-9]{64}$/.test(raw)) {
                return asAddressFriendly(`0:${raw}`);
            }
            return asAddressFriendly(raw);
        }
        if (this.isRecord(raw)) {
            const wc = raw['workchain_id'];
            const addr = raw['address'];
            if ((typeof wc === 'string' || typeof wc === 'number') && typeof addr === 'string') {
                return asAddressFriendly(`${wc}:${addr}`);
            }
        }
        return '';
    }

    private findRecipientJettonWalletFromOut(tx: ToncenterTransaction): string | null {
        for (const m of tx.out_msgs || []) {
            if (m.opcode === '0x178d4519') {
                return asAddressFriendly(m.destination);
            }
        }
        return null;
    }

    private computeStatus(tx: ToncenterTransaction): StatusAction {
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

    private findFirstOwnerTxId(context: MessageHandlerContext): Hex | null {
        const order = context.traceItem.transactions_order || [];
        for (const h of order) {
            const tx = context.transactions[h];
            if (tx && asAddressFriendly(tx.account) === context.ownerAddress) {
                return Base64ToHex(h);
            }
        }
        return null;
    }

    private collectBaseTransactionsSent(context: MessageHandlerContext): Hex[] {
        const order = context.traceItem.transactions_order || [];
        const pairs: { type: string; hex: Hex }[] = [];
        for (const h of order) {
            const tx = context.transactions[h];
            if (!tx) continue;
            if (asAddressFriendly(tx.account) === context.ownerAddress) continue;
            const t = this.getTxType(tx);
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

    private getTxType(tx: ToncenterTransaction): string | '' {
        const opcode = tx.in_msg?.opcode || '';
        const mapping: Record<string, string> = {
            '0x0f8a7ea5': 'jetton_transfer',
            '0x178d4519': 'jetton_internal_transfer',
            '0x7362d09c': 'jetton_notify',
            '0xd53276db': 'excess',
        };
        return mapping[opcode] ?? '';
    }

    private buildJettonInfo(
        context: MessageHandlerContext,
        walletFriendly: string,
    ): {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        image: string;
        verification: string;
        score: number;
    } {
        const walletInfo = context.addressBook[walletFriendly];
        if (walletInfo?.jettonWallet?.jettonMaster) {
            const masterAddress = walletInfo.jettonWallet.jettonMaster;
            const masterInfo = context.addressBook[masterAddress];
            if (masterInfo?.jetton) {
                return masterInfo.jetton;
            }
        }

        const metadata = (context.traceItem as unknown as { metadata?: Record<string, unknown> }).metadata;
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
            const inferred = this.inferMinterFromAddressBook(context.addressBook);
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

    private inferMinterFromAddressBook(addressBook: AddressBook): {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        image: string;
    } | null {
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

    private jettonPreview(
        amount: bigint,
        symbol: string,
        decimals: number,
        image: string | undefined,
        accounts: Account[],
    ): SimplePreview {
        let denom = BigInt(1);
        for (let i = 0; i < (decimals || 0); i++) denom = denom * BigInt(10);
        const value = Number(amount) / Number(denom);
        const human = symbol ? `${this.trimAmount(value)} ${symbol}` : `${this.trimAmount(value)}`;
        const preview: SimplePreview = {
            name: 'Jetton Transfer',
            description: `Transferring ${human}`,
            value: human,
            accounts,
        };
        if (image) preview.valueImage = image;
        return preview;
    }

    private trimAmount(v: number): string {
        if (v >= 1) return `${Number(v.toFixed(3)).toString().replace(/\.0+$/, '')}`;
        const s = v.toFixed(9);
        return s.replace(/0+$/, '').replace(/\.$/, '');
    }

    private toContractAccount(address: string, addressBook: AddressBook): Account {
        const acct = toAccount(address, addressBook);
        return { ...acct, isWallet: false };
    }
}

/**
 * Jetton Internal Transfer Handler (receiving jettons)
 */
export class JettonInternalTransferHandler extends BaseMessageHandler {
    messageType = MessageType.JettonInternalTransfer;
    priority = 10;

    canHandle(message: DecodedMessage, context: MessageHandlerContext): boolean {
        // Check if this is a jetton receive to owner's wallet
        const tx = this.findTransactionForMessage(message, context);
        if (!tx) return false;

        // Skip if this is the owner's main wallet transaction
        return asAddressFriendly(tx.account) !== context.ownerAddress;
    }

    handle(message: DecodedMessage, context: MessageHandlerContext): Action[] {
        const tx = this.findTransactionForMessage(message, context);
        if (!tx || !tx.in_msg) return [];

        const payload = message.payload as Record<string, unknown>;
        const amount = this.toBigInt(this.readAmountValue(this.getProperty(payload, 'amount')));
        const senderMain = this.toAddr(this.getProperty(payload, 'from'));
        const recipientWallet = asAddressFriendly(tx.account);
        const senderWallet = asAddressFriendly(tx.in_msg.source!);

        const status = this.computeStatus(tx);
        const id = (this.getTraceRootId(context.traceItem) ?? Base64ToHex(tx.hash)) as Hex;
        const base = this.collectBaseTransactionsReceived(context);
        const jetton = this.buildJettonInfo(context, recipientWallet);

        const action: JettonTransferAction = {
            type: 'JettonTransfer',
            id,
            status,
            JettonTransfer: {
                sender: toAccount(senderMain, context.addressBook),
                recipient: toAccount(context.ownerAddress, context.addressBook),
                sendersWallet: senderWallet,
                recipientsWallet: recipientWallet,
                amount,
                jetton,
            },
            simplePreview: this.jettonPreview(amount, jetton.symbol, jetton.decimals, jetton.image, [
                toAccount(context.ownerAddress, context.addressBook),
                toAccount(senderMain, context.addressBook),
                this.toContractAccount(jetton.address || '', context.addressBook),
            ]),
            baseTransactions: base as Hex[],
        };

        return [action];
    }

    private findTransactionForMessage(
        message: DecodedMessage,
        context: MessageHandlerContext,
    ): ToncenterTransaction | null {
        for (const tx of Object.values(context.transactions)) {
            if (tx.in_msg && this.messageMatches(tx.in_msg, message.rawMessage)) {
                return tx;
            }
        }
        return null;
    }

    private messageMatches(msg1: unknown, msg2: unknown): boolean {
        return msg1 === msg2;
    }

    private readAmountValue(obj: unknown): string | number | undefined {
        if (!this.isRecord(obj)) return undefined;
        const v = obj['value'];
        if (typeof v === 'string' || typeof v === 'number') return v;
        return undefined;
    }

    private toAddr(raw?: unknown): string {
        if (!raw) return '';
        if (typeof raw === 'string') {
            if (/^[A-Fa-f0-9]{64}$/.test(raw)) {
                return asAddressFriendly(`0:${raw}`);
            }
            return asAddressFriendly(raw);
        }
        if (this.isRecord(raw)) {
            const wc = raw['workchain_id'];
            const addr = raw['address'];
            if ((typeof wc === 'string' || typeof wc === 'number') && typeof addr === 'string') {
                return asAddressFriendly(`${wc}:${addr}`);
            }
        }
        return '';
    }

    private computeStatus(tx: ToncenterTransaction): StatusAction {
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

    private getTraceRootId(item: ToncenterTraceItem): Hex | null {
        const first = (item.transactions_order || [])[0];
        return first ? Base64ToHex(first) : null;
    }

    private collectBaseTransactionsReceived(context: MessageHandlerContext): Hex[] {
        const order = context.traceItem.transactions_order || [];
        const findTx = (predicate: (tx: ToncenterTransaction) => boolean): Hex | null => {
            for (const h of order) {
                const tx = context.transactions[h];
                if (!tx) continue;
                if (predicate(tx)) return Base64ToHex(h);
            }
            return null;
        };

        const root = this.getTraceRootId(context.traceItem);
        const isType = (tx: ToncenterTransaction, type: string) => this.getTxType(tx) === type;
        const jt = findTx((tx) => isType(tx, 'jetton_transfer'));
        const internal = findTx(
            (tx) => isType(tx, 'jetton_internal_transfer') && asAddressFriendly(tx.account) !== context.ownerAddress,
        );
        const excess = findTx((tx) => isType(tx, 'excess'));

        const out: Hex[] = [];
        if (root) out.push(root);
        if (jt) out.push(jt);
        if (internal) out.push(internal);
        if (excess) out.push(excess);
        return out;
    }

    private getTxType(tx: ToncenterTransaction): string | '' {
        const opcode = tx.in_msg?.opcode || '';
        const mapping: Record<string, string> = {
            '0x0f8a7ea5': 'jetton_transfer',
            '0x178d4519': 'jetton_internal_transfer',
            '0x7362d09c': 'jetton_notify',
            '0xd53276db': 'excess',
        };
        return mapping[opcode] ?? '';
    }

    private buildJettonInfo(
        context: MessageHandlerContext,
        walletFriendly: string,
    ): {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        image: string;
        verification: string;
        score: number;
    } {
        const walletInfo = context.addressBook[walletFriendly];
        if (walletInfo?.jettonWallet?.jettonMaster) {
            const masterAddress = walletInfo.jettonWallet.jettonMaster;
            const masterInfo = context.addressBook[masterAddress];
            if (masterInfo?.jetton) {
                return masterInfo.jetton;
            }
        }

        const metadata = (context.traceItem as unknown as { metadata?: Record<string, unknown> }).metadata;
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

        return {
            address: master ? asAddressFriendly(master) : '',
            name,
            symbol,
            decimals,
            image: image ?? '',
            verification: 'whitelist',
            score: 100,
        };
    }

    private jettonPreview(
        amount: bigint,
        symbol: string,
        decimals: number,
        image: string | undefined,
        accounts: Account[],
    ): SimplePreview {
        let denom = BigInt(1);
        for (let i = 0; i < (decimals || 0); i++) denom = denom * BigInt(10);
        const value = Number(amount) / Number(denom);
        const human = symbol ? `${this.trimAmount(value)} ${symbol}` : `${this.trimAmount(value)}`;
        const preview: SimplePreview = {
            name: 'Jetton Transfer',
            description: `Transferring ${human}`,
            value: human,
            accounts,
        };
        if (image) preview.valueImage = image;
        return preview;
    }

    private trimAmount(v: number): string {
        if (v >= 1) return `${Number(v.toFixed(3)).toString().replace(/\.0+$/, '')}`;
        const s = v.toFixed(9);
        return s.replace(/0+$/, '').replace(/\.$/, '');
    }

    private toContractAccount(address: string, addressBook: AddressBook): Account {
        const acct = toAccount(address, addressBook);
        return { ...acct, isWallet: false };
    }
}
