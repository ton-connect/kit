/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Jettons API types based on JETTONS.md specification

import type { Jetton, Network } from '../api/models';

// === Core Jetton Information ===
export interface JettonInfo {
    /** Jetton master contract address. */
    address: string;
    /** Display name of the jetton (e.g., `"Tether USD"`). */
    name: string;
    /** Ticker symbol (e.g., `"USDT"`). */
    symbol: string;
    /** Free-form description set by the issuer. */
    description: string;
    /** Number of decimal places used to format raw amounts (e.g., `6` for USDT). */
    decimals?: number;
    /** Total supply in raw smallest units. */
    totalSupply?: string;
    /** URL of the jetton's image. */
    image?: string;
    /** Inline image data (Base64) when no `image` URL is published. */
    image_data?: string;
    /** Off-chain metadata URI (TEP-64). */
    uri?: string;
    /** Verification status reported by the indexer. */
    verification?: JettonVerification;
    /** Additional indexer-supplied metadata that doesn't fit the canonical fields. */
    metadata?: Record<string, unknown>;
}

export interface JettonVerification {
    /** `true` when the indexer has verified this jetton against an allow-list. */
    verified: boolean;
    /** Origin of the verification claim. */
    source?: 'toncenter' | 'community' | 'manual';
    /** Free-form warnings the UI should surface (e.g., scam indicators). */
    warnings?: string[];
}

// === User's Jetton Holdings ===
export interface AddressJetton extends JettonInfo {
    balance: string;
    jettonWalletAddress: string;
    lastActivity?: string;
    usdValue?: string; // if price data available
}

export interface JettonBalance {
    balance: string;
    jettonAddress: string;
    jettonWalletAddress: string;
    lastUpdated: number;
}

// === Transaction Operations ===
export interface JettonTransferParams {
    toAddress: string; // Recipient address
    jettonAddress: string; // Jetton master address
    amount: string; // Amount in jetton units (not decimals)
    comment?: string; // Transfer comment
}

export interface PreparedJettonTransfer {
    fromAddress: string;
    toAddress: string;
    jettonWalletAddress: string;
    amount: string;
    forwardAmount: string;
    boc: string; // Ready to sign BOC
    estimatedFees: {
        gasFee: string;
        forwardFee: string;
        storageFee: string;
        total: string;
    };
}

// === Transaction History ===
export interface JettonTransfer {
    hash: string;
    timestamp: number;
    from: string;
    to: string;
    jettonAddress: string;
    amount: string;
    comment?: string;
    successful: boolean;
    fees?: TransactionFees;
}

export interface JettonTransaction {
    hash: string;
    timestamp: number;
    type: 'transfer' | 'mint';
    successful: boolean;
    participants: string[];
    jettonAddress: string;
    amount?: string;
    fees: TransactionFees;
    details: JettonTransactionDetails;
}

export interface JettonTransactionDetails {
    opcode?: string;
    forwardAmount?: string;
    bounced?: boolean;
    exitCode?: number;
    rawData?: unknown; // Raw emulation data
}

// === Market Data ===
export interface JettonPrice {
    jettonAddress: string;
    priceUsd: string;
    priceChange24h?: string;
    volume24h?: string;
    marketCap?: string;
    lastUpdated: number;
}

// === Common Types ===
export interface TransactionFees {
    gasFee: string;
    storageFee: string;
    forwardFee?: string;
    total: string;
}

// === Error Types ===
export class JettonError extends Error {
    constructor(
        message: string,
        public code: JettonErrorCode,
        public details?: unknown,
    ) {
        super(message);
        this.name = 'JettonError';
    }
}

export enum JettonErrorCode {
    INVALID_ADDRESS = 'INVALID_ADDRESS',
    JETTON_NOT_FOUND = 'JETTON_NOT_FOUND',
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    NETWORK_ERROR = 'NETWORK_ERROR',
    INVALID_AMOUNT = 'INVALID_AMOUNT',
    PREPARATION_FAILED = 'PREPARATION_FAILED',
}

// === API Interface Definition ===
export interface JettonsAPI {
    // === Information & Discovery ===
    /**
     * Get jetton master info by address
     * @param jettonAddress - The jetton master address
     * @param network - The network to query (required)
     */
    getJettonInfo(jettonAddress: string, network: Network): Promise<JettonInfo | null>;

    /**
     * Get all jettons for a user address
     * @param userAddress - The user's wallet address
     * @param network - The network to query (required)
     * @param offset - Pagination offset
     * @param limit - Pagination limit
     */
    getAddressJettons(userAddress: string, network: Network, offset?: number, limit?: number): Promise<Jetton[]>;

    // === Validation ===
    /** Validate jetton address format */
    validateJettonAddress(address: string): boolean;
}
