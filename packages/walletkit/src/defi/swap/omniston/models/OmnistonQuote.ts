/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * These interfaces are copied from @ston-fi/omniston-sdk.
 * We need concrete models here to ensure seamless porting to iOS and Android versions.
 */

interface OmnistonAddress {
    blockchain: number;
    address: string;
}

interface SwapChunk {
    protocol: string;
    bidAmount: string;
    askAmount: string;
    extraVersion: number;
    extra: number[];
}

interface SwapStep {
    bidAssetAddress: OmnistonAddress | undefined;
    askAssetAddress: OmnistonAddress | undefined;
    chunks: SwapChunk[];
}

interface SwapRoute {
    steps: SwapStep[];
}

interface SwapSettlementParams {
    routes: SwapRoute[];
    minAskAmount: string;
    recommendedMinAskAmount: string;
    recommendedSlippageBps: number;
}

interface EscrowSettlementParams {
    contractAddress: OmnistonAddress | undefined;
    resolverAddress: OmnistonAddress | undefined;
    resolveTimeout: number;
    gasless: boolean;
}

interface HtlcSettlementParams {
    contractAddress: OmnistonAddress | undefined;
    resolverAddress: OmnistonAddress | undefined;
    resolveTimeout: number;
}

interface Quote_ParamsOneOf {
    swap?: SwapSettlementParams | undefined;
    escrow?: EscrowSettlementParams | undefined;
    htlc?: HtlcSettlementParams | undefined;
}

export interface OmnistonQuote {
    quoteId: string;
    resolverId: string;
    resolverName: string;
    bidAssetAddress: OmnistonAddress | undefined;
    askAssetAddress: OmnistonAddress | undefined;
    bidUnits: string;
    askUnits: string;
    referrerAddress: OmnistonAddress | undefined;
    referrerFeeAsset: OmnistonAddress | undefined;
    referrerFeeUnits: string;
    protocolFeeAsset: OmnistonAddress | undefined;
    protocolFeeUnits: string;
    quoteTimestamp: number;
    tradeStartDeadline: number;
    params: Quote_ParamsOneOf | undefined;
    gasBudget: string;
    estimatedGasConsumption: string;
}
