/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Static metadata for a swap provider.
 */
export interface SwapProviderMetadata {
    name: string;
    logo?: string;
    url?: string;
}

/**
 * Used in provider configuration to override fields of the provider's metadata.
 */
export interface SwapProviderMetadataOverride {
    name?: string;
    logo?: string;
    url?: string;
}
