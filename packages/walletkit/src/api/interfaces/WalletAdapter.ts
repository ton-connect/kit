/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex, Base64String, UserFriendlyAddress } from '../models/core/Primitives';
import type { Network } from '../models/core/Network';
import type { ApiClient, WalletId } from '../..';
import type { TransactionRequest } from '../models/transactions/TransactionRequest';
import type { PreparedSignData } from '../models/core/PreparedSignData';
import type { ProofMessage } from '../models/core/ProofMessage';
import type { Feature } from '../../types/jsBridge';

/**
 * Core wallet interface that all wallets must implement
 */
export interface WalletAdapter {
    /** Unique identifier for this wallet (typically public key) */
    getPublicKey(): Hex;

    /** Get the network the wallet is connected to */
    getNetwork(): Network;

    /** Get the TON client instance */
    getClient(): ApiClient;

    /** Get the address of the wallet */
    getAddress(options?: { testnet?: boolean }): UserFriendlyAddress;

    /** Get the wallet ID */
    getWalletId(): WalletId;

    /** Get state init for wallet deployment base64 encoded boc */
    getStateInit(): Promise<Base64String>;

    /** Get the signed send transaction */
    getSignedSendTransaction(
        input: TransactionRequest,
        options?: {
            fakeSignature?: boolean;
            /** Use internal message opcode (0x73696e74) instead of external (0x7369676e) for gasless relaying */
            internal?: boolean;
        },
    ): Promise<Base64String>;
    getSignedSignData(
        input: PreparedSignData,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hex>;
    getSignedTonProof(
        input: ProofMessage,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hex>;

    /**
     * Get supported TON Connect features for this wallet adapter
     * If not implemented, features from deviceInfo will be used
     */
    getSupportedFeatures?(): Feature[];
}
