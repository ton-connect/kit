/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface OnrampCurrency {
    id: string;
    code: string;
    name: string;
    symbol?: string;
    logo?: string;
}

export interface OnrampProvider {
    id: string;
    name: string;
    description?: string;
    logo?: string;
}

export interface CurrencySectionConfig {
    title: string;
    ids: string[];
}

export type AmountInputMode = 'token' | 'currency';

export interface OnrampAmountPreset {
    amount: string;
    label: string;
}

export interface CryptoPaymentMethod {
    id: string;
    /** Token symbol, e.g. "USDC", "USDT" */
    symbol: string;
    /** Token name, e.g. "USD Coin", "Tether" */
    name: string;
    /** Human-readable network name, e.g. "Base", "BSC" */
    network: string;
    /** Source chain id as string (decimal), e.g. "8453", "56" — passed as srcChainId to the onramp provider */
    networkId: string;
    /** Number of decimals for the token */
    decimals: number;
    /** Token contract address on the source network (empty string / zero address for native) */
    address: string;
    logo?: string;
    networkLogo?: string;
}

export interface PaymentMethodSectionConfig {
    title: string;
    ids: string[];
}

/**
 * Target token (what the user is buying on TON) in the crypto onramp widget.
 * Kept separate from AppkitUIToken because `address` is the raw form expected
 * by the onramp provider (e.g. "0x0000000000000000000000000000000000000000"
 * for native TON, "EQCx..." for USDT jetton master).
 */
export interface CryptoOnrampToken {
    id: string;
    /** Token symbol, e.g. "TON", "USDT" */
    symbol: string;
    /** Full token name, e.g. "Toncoin", "Tether" */
    name: string;
    /** Number of decimals for the token */
    decimals: number;
    /** Address as the onramp provider expects it */
    address: string;
    logo?: string;
}

export interface CryptoOnrampTokenSectionConfig {
    title: string;
    ids: string[];
}
