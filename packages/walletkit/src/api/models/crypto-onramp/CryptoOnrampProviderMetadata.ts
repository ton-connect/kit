/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Static metadata for a crypto-onramp provider.
 */
export interface CryptoOnrampProviderMetadata {
    name: string;
    logo?: string;
    url?: string;
    /**
     * Whether this provider requires a refund address on the source chain.
     * When true, the UI must collect a refund address before creating a deposit.
     */
    requiresRefundAddress?: boolean;
}

/**
 * Used in provider configuration to override fields of the provider's metadata.
 */
export interface CryptoOnrampProviderMetadataOverride {
    name?: string;
    logo?: string;
    url?: string;
}
