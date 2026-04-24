/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Cell } from '@ton/core';
import { Address, beginCell } from '@ton/core';

export const JETTON_MASTERS: Record<string, string> = {
    USDT: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
};

export function getJettonMaster(currency: string): string | undefined {
    return JETTON_MASTERS[currency.toUpperCase()];
}

interface JettonTransferParams {
    queryId: bigint;
    jettonAmount: bigint;
    destination: string;
    responseDestination: string;
    forwardTonAmount: bigint;
    forwardPayload?: Cell | null;
}

/**
 * Build the body of a TEP-74 jetton_transfer internal message.
 * Returns a Base64-encoded BoC ready to place in a TransactionRequestMessage.payload.
 *
 * For GetGems FixPriceSale USDT buys the sale contract recognizes the purchase
 * from a jetton_notify with an empty forward_payload, so callers should pass
 * forwardPayload=null.
 */
export function buildJettonTransferBody({
    queryId,
    jettonAmount,
    destination,
    responseDestination,
    forwardTonAmount,
    forwardPayload,
}: JettonTransferParams): string {
    const builder = beginCell()
        .storeUint(0x0f8a7ea5, 32)
        .storeUint(queryId, 64)
        .storeCoins(jettonAmount)
        .storeAddress(Address.parse(destination))
        .storeAddress(Address.parse(responseDestination))
        .storeBit(false)
        .storeCoins(forwardTonAmount);

    if (forwardPayload) {
        builder.storeBit(true).storeRef(forwardPayload);
    } else {
        builder.storeBit(false);
    }

    return builder.endCell().toBoc().toString('base64');
}
