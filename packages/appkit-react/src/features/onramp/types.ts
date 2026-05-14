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
    /** Stable identifier for the method — used for selection state and `methodSections.ids` */
    id: string;
    /** Token symbol, e.g. "USDC", "USDT" */
    symbol: string;
    /** Full token name shown in the picker, e.g. "USD Coin", "Tether" */
    name: string;
    /**
     * Source chain in CAIP-2 format, e.g. "eip155:8453", "eip155:56" — passed
     * as `sourceChain` to the onramp provider. The widget resolves a display
     * name and logo for it via the `chains` map (see `CryptoOnrampWidgetProvider`).
     */
    chain: string;
    /** Number of decimals for the token (used to convert between display and base units) */
    decimals: number;
    /** Token contract address on the source network (empty string / zero address for native) */
    address: string;
    /** Token logo URL shown in the picker and selectors */
    logo?: string;
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
