/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    WalletAdapter,
    Hex,
    ApiClient,
    UserFriendlyAddress,
    Base64String,
    Network,
    TransactionRequest,
    PreparedSignData,
    ProofMessage,
} from '@ton/walletkit';

import { WalletId } from '../../walletkit/dist/cjs';

export class SwiftWalletAdapter implements WalletAdapter {
    private swiftWalletAdapter: WalletAdapter;
    private client: ApiClient;

    constructor(swiftWalletAdapter: WalletAdapter, client: ApiClient) {
        this.swiftWalletAdapter = swiftWalletAdapter;
        this.client = client;
    }

    getPublicKey(): Hex {
        return this.swiftWalletAdapter.getPublicKey();
    }

    getNetwork(): Network {
        return this.swiftWalletAdapter.getNetwork();
    }

    getClient(): ApiClient {
        return this.client;
    }

    /** Get wallet's TON address */
    getAddress(options?: { testnet?: boolean }): UserFriendlyAddress {
        return this.swiftWalletAdapter.getAddress(options);
    }

    getWalletId(): WalletId {
        return this.swiftWalletAdapter.getWalletId();
    }

    /** Get state init for wallet deployment base64 encoded boc */
    getStateInit(): Promise<Base64String> {
        return this.swiftWalletAdapter.getStateInit();
    }

    getSignedSendTransaction(
        input: TransactionRequest,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Base64String> {
        return this.swiftWalletAdapter.getSignedSendTransaction(input, options);
    }

    getSignedSignData(
        input: PreparedSignData,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hex> {
        return this.swiftWalletAdapter.getSignedSignData(input, options);
    }

    getSignedTonProof(
        input: ProofMessage,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hex> {
        return this.swiftWalletAdapter.getSignedTonProof(input, options);
    }
}
