/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OmnistonAddress } from './OmnistonAddress';

/**
 * This interface is copied from @ston-fi/omniston-sdk.
 * We need concrete models here to ensure seamless porting
 * of walletkit to iOS and Android versions.
 */
export interface OmnistonQuote {
    quoteId: string;
    resolverId: string;
    resolverName: string;
    bidAssetAddress: OmnistonAddress | undefined;
    askAssetAddress: OmnistonAddress | undefined;
    bidUnits: string;
    askUnits: string;
    referrerAddress: OmnistonAddress | undefined;
    protocolFeeAsset: OmnistonAddress | undefined;
    protocolFeeUnits: string;
    quoteTimestamp: number;
    tradeStartDeadline: number;
    // TODO: add params
    // params: Quote_ParamsOneOf | undefined;
    gasBudget: string;
    estimatedGasConsumption: string;
}
