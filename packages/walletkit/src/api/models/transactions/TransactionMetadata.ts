/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenImage } from '../core/TokenImage';
import type { TokenAmount } from '../core/TokenAmount';
import type { UserFriendlyAddress } from '../core/Primitives';

/**
 * Metadata about addresses, including indexing and associated token info.
 */
export type TransactionAddressMetadata = {
    [key: UserFriendlyAddress]: TransactionAddressMetadataEntry;
};

/**
 * Metadata entry for a specific address in a transaction.
 */
export interface TransactionAddressMetadataEntry {
    /**
     * Token information associated with this address, if any
     */
    tokenInfo?: TransactionTokenInfo[];
}

/**
 * Token information discriminated by token type.
 */
export type TransactionTokenInfo =
    | { type: 'jetton_wallets'; value: TransactionTokenInfoJettonWallets }
    | { type: 'jetton_masters'; value: TransactionTokenInfoJettonMasters }
    | { type: 'unknown'; value: TransactionTokenInfoBase };

/**
 * Base token information shared by all token types.
 */
export interface TransactionTokenInfoBase {
    /**
     * Indicates if the token contract is valid
     */
    isValid: boolean;
    /**
     * Type of token
     */
    type: string;
    /**
     * Additional metadata for the token, such as image sizes, decimal precision, external links, and marketplaces
     */
    extra: { [key: string]: unknown };
}

/**
 * Token information for Jetton wallet contracts.
 */
export interface TransactionTokenInfoJettonWallets extends TransactionTokenInfoBase {
    /**
     * Current balance of the Jetton wallet
     */
    balance: TokenAmount;
    /**
     * Address of the Jetton master contract
     */
    jetton: UserFriendlyAddress;
    /**
     * Owner address of this Jetton wallet
     */
    owner: UserFriendlyAddress;
}

/**
 * Token information for Jetton master contracts.
 */
export interface TransactionTokenInfoJettonMasters extends TransactionTokenInfoBase {
    /**
     * Display name of the Jetton
     */
    name: string;
    /**
     * Ticker symbol of the Jetton
     */
    symbol: string;
    /**
     * Human-readable description of the Jetton
     */
    description: string;
    /**
     * Number of decimal places for the Jetton amount
     * @format int
     */
    decimalsCount: number;
    /**
     * Token image in various sizes
     */
    image?: TokenImage;
    /**
     * Social media links for the Jetton project
     */
    social: string[];
    /**
     * Metadata URI for the Jetton
     */
    uri: string;
    /**
     * Official website URLs for the Jetton project
     */
    websites: string[];
}
