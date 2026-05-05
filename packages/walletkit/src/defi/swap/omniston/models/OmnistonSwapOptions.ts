/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const SETTLEMENT_METHOD_SWAP = 'SETTLEMENT_METHOD_SWAP';
export const SETTLEMENT_METHOD_ESCROW = 'SETTLEMENT_METHOD_ESCROW';
export const SETTLEMENT_METHOD_HTLC = 'SETTLEMENT_METHOD_HTLC';
export const UNRECOGNIZED = 'UNRECOGNIZED';

export const SettlementMethod = {
    SETTLEMENT_METHOD_SWAP: SETTLEMENT_METHOD_SWAP,
    SETTLEMENT_METHOD_ESCROW: SETTLEMENT_METHOD_ESCROW,
    SETTLEMENT_METHOD_HTLC: SETTLEMENT_METHOD_HTLC,
    UNRECOGNIZED: UNRECOGNIZED,
} as const;

export type SettlementMethodValue = (typeof SettlementMethod)[keyof typeof SettlementMethod];

export type OmnistonSwapOptions = {
    /**
     * Settlement methods to use for the swap
     */
    settlementMethods?: SettlementMethodValue[];
};
