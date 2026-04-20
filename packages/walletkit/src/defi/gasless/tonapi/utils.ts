/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    Address,
    beginCell,
    Cell,
    external,
    internal,
    loadMessageRelaxed,
    loadStateInit,
    storeMessage,
    storeMessageRelaxed,
} from '@ton/core';

import type { Base64String, TransactionRequestMessage } from '../../../api/models';
import { GaslessError } from '../errors';

export const stripHexPrefix = (value: string): string => {
    return value.startsWith('0x') ? value.slice(2) : value;
};

export const cellToBase64 = (cell: Cell): Base64String => {
    return cell.toBoc().toString('base64') as Base64String;
};

export const buildInternalMessageCell = (message: TransactionRequestMessage): Cell => {
    const to = Address.parse(message.address);
    const value = BigInt(message.amount);
    const body = message.payload ? Cell.fromBase64(message.payload) : beginCell().endCell();
    const init = message.stateInit ? loadStateInit(Cell.fromBase64(message.stateInit).beginParse()) : undefined;

    return beginCell()
        .storeWritable(
            storeMessageRelaxed(
                internal({
                    to,
                    value,
                    // Jetton transfers (the primary gasless use case) require bounce=true;
                    // TransactionRequestMessage does not carry a bounce flag, so we default
                    // to true. Callers needing non-bounceable messages should handle that
                    // outside the gasless flow.
                    bounce: true,
                    body,
                    init,
                }),
            ),
        )
        .endCell();
};

/**
 * Convert an internal-message BoC (what `wallet.signMessage` returns) into an
 * external message BoC that the relayer accepts for broadcast.
 */
export const internalBocToExternalMessageBoc = (internalBoc: Base64String): Cell => {
    const parsed = Cell.fromBase64(internalBoc);
    const { info, body, init } = loadMessageRelaxed(parsed.beginParse());

    if (info.type !== 'internal') {
        throw new GaslessError('Signed message must be an internal message', GaslessError.SEND_FAILED);
    }

    return beginCell()
        .storeWritable(
            storeMessage(
                external({
                    to: info.dest,
                    init: init ?? undefined,
                    body,
                }),
            ),
        )
        .endCell();
};
