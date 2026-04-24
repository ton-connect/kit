/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Feature, SendTransactionResponse, Hex, UserFriendlyAddress } from '@ton/walletkit';

import type { TransactionRequest } from './transaction';
import type { SignDataRequest, SignDataResponse, SignMessageResponse } from './signing';
import type { Network } from './network';

/**
 * Minimal wallet interface for appkit.
 * Only includes methods that require wallet-specific logic (signing, identity).
 * Data fetching (balance, jettons, nfts) is done via actions using networkManager.
 */
export interface WalletInterface {
    /** Connector that created this wallet */
    readonly connectorId: string;

    // ==========================================
    // Identity
    // ==========================================

    /** Get the wallet address */
    getAddress(): UserFriendlyAddress;

    /** Get the wallet public key */
    getPublicKey(): Hex;

    /** Get the network the wallet is connected to */
    getNetwork(): Network;

    /** Get unique wallet identifier */
    getWalletId(): string;

    /**
     * Features supported by the underlying wallet (e.g. SendTransaction, SignData, SignMessage).
     * Returns undefined when the connector cannot report capabilities.
     * Callers should gracefully degrade when a feature is missing.
     */
    getSupportedFeatures(): Feature[] | undefined;

    // ==========================================
    // Actions requiring wallet signature
    // ==========================================

    /** Send a transaction (wallet signs and submits) */
    sendTransaction(request: TransactionRequest): Promise<SendTransactionResponse>;

    /** Sign arbitrary data using TonConnect signData */
    signData(payload: SignDataRequest): Promise<SignDataResponse>;

    /**
     * Sign a transaction-shaped request without broadcasting it.
     * The wallet returns a signed internal-message BoC that a third party can relay
     * on-chain (e.g. a gasless relayer).
     *
     * Requires the wallet to support the SignMessage feature (see getSupportedFeatures).
     */
    signMessage(request: TransactionRequest): Promise<SignMessageResponse>;
}
