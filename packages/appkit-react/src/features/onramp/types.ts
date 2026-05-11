/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Fiat currency displayed in onramp pickers (e.g. `OnrampCurrencySelectModal`). Internal: TonPay / fiat onramp are not part of the public API yet.
 */
export interface OnrampCurrency {
    /** Stable identifier used by section configs and pre-selection props. */
    id: string;
    /** Ticker code (e.g. `"USD"`, `"EUR"`). */
    code: string;
    /** Human-readable name (e.g. `"US Dollar"`). */
    name: string;
    /** Optional currency symbol (e.g. `"$"`). */
    symbol?: string;
    /** Optional logo URL. */
    logo?: string;
}

/**
 * Onramp provider displayed in `OnrampProviderSelect`. Internal: fiat onramp is not part of the public API yet.
 */
export interface OnrampProvider {
    /** Stable provider identifier. */
    id: string;
    /** Display name. */
    name: string;
    /** Short description shown under the name (e.g. supported methods). */
    description?: string;
    /** Optional logo URL. */
    logo?: string;
}

/**
 * Section configuration grouping `OnrampCurrency` entries by id in a picker. Internal: TonPay / fiat onramp are not part of the public API yet.
 */
export interface CurrencySectionConfig {
    /** Section header (typically already localized by the caller). */
    title: string;
    /** Ids of {@link OnrampCurrency} entries to include in this section, in order. */
    ids: string[];
}

/**
 * Which side the amount input is denominated in — `token` (crypto) vs `currency` (fiat). Internal: fiat onramp is not part of the public API yet; the crypto onramp widget uses `CryptoAmountInputMode` instead.
 */
export type AmountInputMode = 'token' | 'currency';

/**
 * Quick-pick amount button shown above the crypto-onramp input (carried on {@link CryptoOnrampContextType}'s `presetAmounts`).
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface OnrampAmountPreset {
    /** Amount value the preset sets on click (decimal string). */
    amount: string;
    /** Button label shown to the user. */
    label: string;
}

/**
 * Source crypto payment method (what the user pays with on another chain) in the crypto onramp widget.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
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

/**
 * Section configuration grouping {@link CryptoPaymentMethod} entries by id in a picker.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface PaymentMethodSectionConfig {
    /** Section header (typically already localized by the caller). */
    title: string;
    /** Ids of {@link CryptoPaymentMethod} entries to include in this section, in order. */
    ids: string[];
}

/**
 * Target token (what the user is buying on TON) in the crypto onramp widget. Kept separate from `AppkitUIToken` because `address` is the raw form expected by the onramp provider (e.g. `"0x0000000000000000000000000000000000000000"` for native TON, `"EQCx..."` for USDT jetton master).
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface CryptoOnrampToken {
    /** Stable identifier used by section configs and pre-selection props. */
    id: string;
    /** Token symbol, e.g. `"TON"`, `"USDT"`. */
    symbol: string;
    /** Full token name, e.g. `"Toncoin"`, `"Tether"`. */
    name: string;
    /** Number of decimals for the token. */
    decimals: number;
    /** Address as the onramp provider expects it. */
    address: string;
    /** Optional logo URL. */
    logo?: string;
}

/**
 * Section configuration grouping {@link CryptoOnrampToken} entries by id in a picker.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface CryptoOnrampTokenSectionConfig {
    /** Section header (typically already localized by the caller). */
    title: string;
    /** Ids of {@link CryptoOnrampToken} entries to include in this section, in order. */
    ids: string[];
}
