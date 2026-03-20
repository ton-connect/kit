/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Configuration types for createTonWalletMCP factory
 */

import type { Wallet, WalletSigner, WalletV4R2Adapter, WalletV5R1Adapter } from '@ton/walletkit';

import type { AgenticWalletAdapter } from '../contracts/agentic_wallet/AgenticWalletAdapter.js';
import type { IContactResolver } from './contacts.js';

export type NetworkType = 'mainnet' | 'testnet' | 'tetra';
export type SupportedWalletVersion = 'agentic' | 'v4r2' | 'v5r1';
export type SupportedWalletAdapter = WalletV4R2Adapter | WalletV5R1Adapter | AgenticWalletAdapter;
export type FixedWallet = Wallet | SupportedWalletAdapter;

/**
 * Network-specific configuration
 */
export interface NetworkConfig {
    /** TonCenter API key for this network */
    apiKey?: string;
}

/**
 * Configuration for createTonWalletMCP factory
 */
export interface TonMcpConfig {
    /**
     * Optional fixed wallet instance for backward-compatible single-wallet mode.
     * If omitted, the server can run against the local config registry.
     */
    wallet?: FixedWallet;

    /**
     * Optional WalletKit signer for single-wallet mode.
     * When provided, @ton/mcp will create a wallet adapter internally.
     */
    signer?: WalletSigner;

    /**
     * Network used when creating a wallet from signer in single-wallet mode.
     * Defaults to mainnet.
     */
    network?: 'mainnet' | 'testnet';

    /**
     * Wallet version used in single-wallet mode.
     * Defaults to v5r1 when signer is provided.
     */
    walletVersion?: SupportedWalletVersion;

    /**
     * Agentic wallet address for signer-based single-wallet mode.
     * Required when walletVersion is "agentic" unless init params are provided.
     */
    agenticWalletAddress?: string;

    /**
     * Agentic wallet NFT index for signer-based single-wallet mode.
     */
    agenticWalletNftIndex?: bigint;

    /**
     * Agentic collection address for signer-based single-wallet mode.
     */
    agenticCollectionAddress?: string;

    /**
     * Optional contact resolver for name-to-address resolution.
     */
    contacts?: IContactResolver;

    /**
     * Network-specific configuration (API keys).
     */
    networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };
}
