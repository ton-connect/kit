/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Token / network descriptors returned by Layerswap. Non-exhaustive — only the
 * fields we consume.
 */
export interface LayerswapToken {
    symbol: string;
    display_asset: string;
    logo: string | null;
    contract: string | null;
    decimals: number;
    price_in_usd: number;
    precision: number;
    listing_date: string;
    source_rank: number;
    destination_rank: number;
    group: string;
}

export interface LayerswapNetwork {
    name: string;
    display_name: string;
    logo: string;
    chain_id: string | null;
    node_url: string | null;
    nodes: string[];
    type: string;
    transaction_explorer_template: string;
    account_explorer_template: string;
    token?: LayerswapToken;
}

export interface LayerswapDepositAction {
    type: string;
    to_address: string;
    amount: number;
    order: number;
    amount_in_base_units: string;
    network: LayerswapNetwork;
    token: LayerswapToken;
    fee_token: LayerswapToken;
    call_data: string | null;
    encoded_args: unknown[];
}

export type LayerswapSwapStatus =
    | 'user_transfer_pending'
    | 'ls_transfer_pending'
    | 'completed'
    | 'failed'
    | 'refund_pending'
    | 'refunded';

export interface LayerswapSwap {
    id: string;
    created_date: string;
    source_network: LayerswapNetwork;
    source_token: LayerswapToken;
    destination_network: LayerswapNetwork;
    destination_token: LayerswapToken;
    requested_amount: number;
    destination_address: string;
    status: LayerswapSwapStatus | string;
    fail_reason: string | null;
    use_deposit_address: boolean;
    metadata: Record<string, unknown>;
    transactions: unknown[];
}

export interface LayerswapQuote {
    source_network: LayerswapNetwork;
    source_token: LayerswapToken;
    destination_network: LayerswapNetwork;
    destination_token: LayerswapToken;
    requested_amount: number;
    receive_amount: number;
    fee_discount: number;
    min_receive_amount: number;
    blockchain_fee: number;
    service_fee: number;
    avg_completion_time: string;
    refuel_in_source: number;
    slippage: number;
    rate: number;
    total_fee: number;
    total_fee_in_usd: number;
}

export interface LayerswapSwapData {
    deposit_actions: LayerswapDepositAction[];
    swap: LayerswapSwap;
    quote: LayerswapQuote;
    refuel: unknown | null;
    reward: unknown | null;
}

export interface LayerswapCreateSwapResponse {
    data: LayerswapSwapData;
}

export interface LayerswapGetSwapResponse {
    data: LayerswapSwapData;
}

export interface LayerswapErrorResponse {
    error: {
        code?: string;
        message: string;
        [key: string]: unknown;
    };
}
