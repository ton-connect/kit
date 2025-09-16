// Types based on UTD-API (Universal TON DeFi API) specification

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

export interface Action {
    id: string;
    category: string;
    title: string;
    version: string;
    contracts: Array<{
        address: string;
        role: string;
    }>;
    input_schema: Record<string, unknown>;
    output_schema: Record<string, unknown>;
    quote_url: string;
    build_url: string;
    ui_hints?: Record<string, unknown>;
}

export interface TokenRef {
    standard: 'jetton' | 'ton';
    address: string;
    decimals: number;
    symbol: string;
}

export interface SwapInput {
    amount_in: string; // Token input amount in smallest units
    token_in: TokenRef;
    token_out: TokenRef;
    wallet_address: string; // User wallet address
    slippage_bps?: string; // Slippage in basis points
    chain_id: number; // Network number (1 = mainnet, 2 = testnet)
    use_gasless?: boolean; // If true, protocol sponsors gas
    excess_address?: string; // Address receiving excess TON if gasless is used
    referrer?: string;
    client?: {
        name: string;
        version: string;
    };
    idempotency_key?: string;
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
    warnings: string[];
    expires_at: string;
}

export interface TonConnectMessage {
    address: string;
    amount: string;
    payload: string;
    state_init?: string | null;
}

export interface DeFiEndpoint {
    name: string;
    url: string;
    status: 'connected' | 'disconnected' | 'loading';
    meta?: ApiMeta;
    actions?: Action[];
}

// UI-specific types
export interface SwapFormData {
    tokenIn: TokenRef | null;
    tokenOut: TokenRef | null;
    amountIn: string;
    slippageBps: string;
    useGasless: boolean;
    excessAddress?: string;
}

export interface QuoteResult {
    quote: SwapQuote | null;
    loading: boolean;
    error?: string;
}
