/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Route step from DeDust Router API
 */
export interface DeDustRouteStep {
    pool_address: string;
    is_stable: boolean;
    in_minter: string;
    out_minter: string;
    in_amount: string;
    out_amount: string;
    network_fee: string;
    protocol_slug: string;
    stonfi_extra_details?: {
        router: string;
        from_router_wallet: string;
        to_router_wallet: string;
    };
}

/**
 * Swap data from DeDust Router API quote response
 */
export interface DeDustSwapData {
    slippage_bps: number;
    routes: DeDustRouteStep[][];
}

/**
 * Quote response from DeDust Router API
 */
export interface DeDustQuoteResponse {
    in_amount: string;
    out_amount: string;
    swap_data: DeDustSwapData;
    swap_is_possible: boolean;
    price_impact?: number;
    improvement?: string;
    in_minter_price?: string;
    out_minter_price?: string;
}

/**
 * Swap request to DeDust Router API
 */
export interface DeDustSwapRequest {
    sender_address: string;
    swap_data: {
        slippage_bps: number;
        routes: DeDustRouteStep[];
    };
    referral_address?: string;
    referral_fee?: number;
    jetton_wallet_state_init?: string;
    custom_payload?: string;
}

/**
 * Swap transaction from DeDust Router API
 */
export interface DeDustSwapTransaction {
    address: string;
    amount: string;
    payload: string;
    state_init?: string;
}

/**
 * Swap response from DeDust Router API
 */
export interface DeDustSwapResponse {
    query_id: number;
    transactions: DeDustSwapTransaction[];
}
