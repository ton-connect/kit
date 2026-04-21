/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * VM type identifier returned by swaps.xyz. Matches `vmId` from /getChainList.
 */
export type SwapsXyzVmId = 'evm' | 'solana' | 'alt-vm' | 'hypercore';

export type SwapsXyzSwapDirection = 'exact-amount-in' | 'exact-amount-out';

/**
 * Token / amount entry as returned by swaps.xyz (Payment object).
 */
export interface SwapsXyzPayment {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    isNative: boolean;
    amount: string;
    usdAmount: number;
    logo: string | null;
    swapsXyzCode: string;
}

export interface SwapsXyzEvmTx {
    to: string;
    toExtra: string | null;
    value: string;
    chainId: number;
    chainKey: string;
}

export interface SwapsXyzBridgeRouteStep {
    srcChainId: number;
    dstChainId: number;
    srcBridgeToken: string;
    dstBridgeToken: string;
    bridgeId: string;
}

/**
 * Successful response of GET /api/getAction for actionType=swap-action.
 *
 * Non-exhaustive — only the fields we consume. `allRoutes` is an array of the
 * same shape and is not typed here.
 */
export interface SwapsXyzGetActionResponse {
    tx: SwapsXyzEvmTx;
    txId: string;
    vmId: SwapsXyzVmId;
    amountIn: SwapsXyzPayment;
    amountInMax: SwapsXyzPayment;
    amountOut: SwapsXyzPayment;
    amountOutMin: SwapsXyzPayment;
    protocolFee: SwapsXyzPayment;
    applicationFee: SwapsXyzPayment;
    bridgeFee: SwapsXyzPayment;
    bridgeIds: string[];
    bridgeRoute: SwapsXyzBridgeRouteStep[];
    exchangeRate: number;
    estimatedTxTime: number;
    estimatedPriceImpact: number;
    requiresTokenApproval: boolean;
    executionsType: 'DEFAULT' | 'GASLESS';
}

export interface SwapsXyzErrorResponse {
    success: false;
    error: {
        code: string;
        name: string;
        message: string;
        title: string;
        statusCode: number;
        details?: unknown;
        timestamp: string;
    };
}
