/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SettlementMethod as StonFiSettlementMethod } from '@ston-fi/omniston-sdk';

import type {
    SETTLEMENT_METHOD_ESCROW,
    SETTLEMENT_METHOD_HTLC,
    SETTLEMENT_METHOD_SWAP,
    UNRECOGNIZED,
} from './models/OmnistonSwapOptions';

type SettlementMethodLiteralsBySdkKey = {
    [StonFiSettlementMethod.SETTLEMENT_METHOD_SWAP]: typeof SETTLEMENT_METHOD_SWAP;
    [StonFiSettlementMethod.SETTLEMENT_METHOD_ESCROW]: typeof SETTLEMENT_METHOD_ESCROW;
    [StonFiSettlementMethod.SETTLEMENT_METHOD_HTLC]: typeof SETTLEMENT_METHOD_HTLC;
    [StonFiSettlementMethod.UNRECOGNIZED]: typeof UNRECOGNIZED;
};

type SdkSettlementMethodRecord = Record<StonFiSettlementMethod, StonFiSettlementMethod>;
// On SDK drift, `SdkSettlementMethodLiteralsCheck` is `never` and the next line errors
type SdkSettlementMethodLiteralsCheck = SettlementMethodLiteralsBySdkKey extends SdkSettlementMethodRecord
    ? true
    : never;
const _settlementMethodLiteralsMatchSdk: SdkSettlementMethodLiteralsCheck = true;
