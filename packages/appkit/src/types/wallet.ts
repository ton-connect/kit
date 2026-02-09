/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network, SendTransactionResponse, TransactionRequest, Hex, UserFriendlyAddress } from '@ton/walletkit';

import type { SignDataRequest, SignDataResponse } from './signing';

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

    // ==========================================
    // Actions requiring wallet signature
    // ==========================================

    /** Send a transaction (wallet signs and submits) */
    sendTransaction(request: TransactionRequest): Promise<SendTransactionResponse>;

    /** Sign arbitrary data using TonConnect signData */
    signData(payload: SignDataRequest): Promise<SignDataResponse>;
}
