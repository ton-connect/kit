/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fromNano } from '@ton/core';

import { AddressBook, toAccount, TonTransferAction, StatusAction } from '../AccountEvent';
import { EmulationMessage, ToncenterTransaction } from '../emulation';
import { Base64ToHex } from '../../../utils/base64';

export function parseOutgoingTonTransfers(
    tx: ToncenterTransaction,
    addressBook: AddressBook,
    status: StatusAction,
): TonTransferAction[] {
    const actions: TonTransferAction[] = [];
    for (const msg of tx.out_msgs || []) {
        const valueNum = toPositiveNumber(msg.value);
        if (valueNum === null) {
            continue;
        }
        const sender = msg.source ?? tx.account;
        const recipient = msg.destination;
        const amount = BigInt(valueNum);

        const recipientAccount = msg.init_state
            ? toContractAccount(recipient, addressBook)
            : toAccount(recipient, addressBook);
        const comment = extractComment(msg) ?? undefined;
        actions.push({
            type: 'TonTransfer',
            id: Base64ToHex(tx.hash),
            status,
            TonTransfer: {
                sender: toAccount(sender, addressBook),
                recipient: recipientAccount,
                amount,
                ...(comment !== undefined ? { comment } : {}),
            },
            simplePreview: {
                name: 'Ton Transfer',
                description: `Transferring ${fromNano(String(amount))} TON`,
                value: `${fromNano(String(amount))} TON`,
                accounts: [toAccount(sender, addressBook), recipientAccount],
            },
            baseTransactions: [Base64ToHex(tx.hash)],
        });
    }
    return actions;
}

export function parseIncomingTonTransfers(
    tx: ToncenterTransaction,
    addressBook: AddressBook,
    status: StatusAction,
): TonTransferAction[] {
    const actions: TonTransferAction[] = [];
    const msg = tx.in_msg;
    if (!msg) {
        return actions;
    }
    const valueNum = toPositiveNumber(msg.value);
    if (valueNum === null) {
        return actions;
    }
    const sender = msg.source ?? tx.account;
    const recipient = msg.destination;
    const amount = BigInt(valueNum);

    // For incoming TON transfers, if funds were credited (credit_ph exists and has credit),
    // consider it successful even if compute phase failed (no_gas, etc.)
    const incomingStatus = computeIncomingTonTransferStatus(tx, status);

    const recipientAccount = msg.init_state
        ? toContractAccount(recipient, addressBook)
        : toAccount(recipient, addressBook);
    const comment = extractComment(msg) ?? undefined;
    actions.push({
        type: 'TonTransfer',
        id: Base64ToHex(tx.hash),
        status: incomingStatus,
        TonTransfer: {
            sender: toAccount(sender, addressBook),
            recipient: recipientAccount,
            amount,
            ...(comment !== undefined ? { comment } : {}),
        },
        simplePreview: {
            name: 'Ton Transfer',
            description: `Transferring ${fromNano(String(amount))} TON`,
            value: `${fromNano(String(amount))} TON`,
            accounts: [toAccount(sender, addressBook), recipientAccount],
        },
        baseTransactions: [Base64ToHex(tx.hash)],
    });
    return actions;
}

export function computeStatus(tx: ToncenterTransaction): StatusAction {
    const aborted = Boolean(tx.description?.aborted);
    const computeSuccess = Boolean(tx.description?.compute_ph?.success);
    const actionSuccess = Boolean(tx.description?.action?.success);
    return !aborted && computeSuccess && actionSuccess ? 'success' : 'failure';
}

/**
 * Compute status specifically for incoming TON transfers.
 * For incoming transfers, if funds were credited (credit_ph has credit > 0),
 * it's considered successful even if compute phase failed.
 */
function computeIncomingTonTransferStatus(tx: ToncenterTransaction, defaultStatus: StatusAction): StatusAction {
    const description = tx.description as unknown as Record<string, unknown>;
    
    // Check if credit phase exists and has credited funds
    const creditPh = description?.credit_ph as Record<string, unknown> | undefined;
    const credit = creditPh?.credit as string | undefined;
    
    // If funds were credited (credit > 0), consider incoming transfer successful
    if (credit && Number(credit) > 0) {
        return 'success';
    }
    
    // Otherwise use the default computed status
    return defaultStatus;
}

function toPositiveNumber(value: string | null): number | null {
    if (value === null || value === undefined) {
        return null;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
        return null;
    }
    return n;
}

function extractComment(msg: EmulationMessage): string | null {
    type DecodedComment = { '@type'?: string; comment?: string; text?: string } | null | undefined;
    const decoded: DecodedComment = (msg.message_content &&
        (msg.message_content as { decoded?: unknown }).decoded) as DecodedComment;
    if (decoded && typeof decoded === 'object') {
        if (typeof decoded.comment === 'string' && decoded.comment.length > 0) {
            return decoded.comment;
        }
        if (decoded['@type'] === 'text_comment' && typeof decoded.text === 'string' && decoded.text.length > 0) {
            return decoded.text;
        }
    }
    return null;
}

function toContractAccount(address: string, addressBook: AddressBook) {
    const acc = toAccount(address, addressBook);
    return { ...acc, isWallet: false };
}
