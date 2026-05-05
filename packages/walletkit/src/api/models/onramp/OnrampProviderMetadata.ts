/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Static metadata for a registered onramp provider (SDK-level abstraction).
 *
 * Distinct from {@link OnrampServiceInfo}, which describes the underlying onramp
 * service (e.g. MoonPay) attached to an individual quote.
 */
export interface OnrampProviderMetadata {
    /**
     * Human-readable provider name (e.g. 'AppKit Onramp')
     */
    name: string;

    /**
     * URL to the provider's logo image
     */
    logo?: string;

    /**
     * URL to the provider's website
     */
    url?: string;

    /**
     * Whether this provider supports reversed (crypto-amount) quotes.
     * When false, the UI should hide the direction toggle and only allow fiat-amount input.
     */
    isReversedAmountSupported?: boolean;
}

/**
 * Used in provider configuration to override fields of the provider's metadata.
 */
export interface OnrampProviderMetadataOverride {
    name?: string;
    logo?: string;
    url?: string;
}
