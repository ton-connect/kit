/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Cell, beginCell, loadMessage, storeMessage } from '@ton/core';

import type { Base64String } from '../api/models';

/**
 * Generates a normalized hash of an "external-in" message for comparison.
 *
 * This function ensures consistent hashing of external-in messages by following [TEP-467].
 * See documentation: https://docs.ton.org/ecosystem/ton-connect/message-lookup#transaction-lookup-using-external-message-from-ton-connect
 *
 * @param params - An object containing the built BOC as a base64 string.
 * @returns An object containing the hash (Base64 string) and the boc (Base64 string) of the normalized message.
 * @throws if the message type is not `external-in`.
 */
export function getNormalizedExtMessageHash(boc: string): { hash: Base64String; boc: Base64String } {
    const cell = Cell.fromBase64(boc);
    const message = loadMessage(cell.beginParse());

    if (message.info.type !== 'external-in') {
        throw new Error(`Message must be "external-in", got ${message.info.type}`);
    }

    const info = {
        ...message.info,
        src: undefined,
        importFee: 0n,
    };

    const normalizedMessage = {
        ...message,
        init: null,
        info: info,
    };

    const normalizedCell = beginCell()
        .store(storeMessage(normalizedMessage, { forceRef: true }))
        .endCell();

    return {
        hash: normalizedCell.hash().toString('base64') as Base64String,
        boc: normalizedCell.toBoc().toString('base64') as Base64String,
    };
}
