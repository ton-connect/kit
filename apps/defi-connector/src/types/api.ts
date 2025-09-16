// Types based on the UTD-API specification

export interface TokenRef {
    standard: 'jetton' | 'ton';
    address: string;
    decimals: number;
    symbol: string;
}

export interface Action {
    id: string;
    category: string;
    title: string;
    version: string;
    contracts: Array<{
        address: string;
        role: string;
    }>;
    input_schema: object;
    output_schema: object;
    quote_url: string;
    build_url: string;
    ui_hints: object;
}

export interface SwapInput {
    amount_in: string;
    token_in: TokenRef;
    token_out: TokenRef;
    wallet_address: string;
    slippage_bps?: string;
    chain_id: number;
    use_gasless?: boolean;
    excess_address?: string;
    referrer?: string;
    client?: {
        name: string;
        version: string;
    };
    idempotency_key?: string;
}

export interface TonConnectMessage {
    address: string;
    amount: string;
    payload: string;
    state_init?: string | null;
}

export interface SwapQuote {
    action_id: string;
    quote_id: string;
    build_id: string;
    token_in: TokenRef;
    token_out: TokenRef;
    expected_out: string;
    min_out: string;
    route: string[];
    price_impact_bps: string;
    fee: string;
    gas_ton: string;
    ton_connect: {
        messages: TonConnectMessage[];
        valid_until: number;
    };
    nonce: string;
    gasless_used: boolean;
    warnings?: string[];
    expires_at: string;
}

export interface ApiMeta {
    spec: string;
    version: string;
    name: string;
    chain_id: number;
    supported_chain_ids: number[];
    contact?: {
        email: string;
    };
    docs_url?: string;
}

export interface ApiError {
    error: {
        code: string;
        message: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details?: any;
    };
}
