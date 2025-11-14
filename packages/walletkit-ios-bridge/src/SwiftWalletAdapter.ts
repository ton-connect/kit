/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    IWalletAdapter,
    Hex,
    CHAIN,
    ConnectTransactionParamContent,
    PrepareSignDataResult,
    TonProofParsedMessage,
    ApiClient,
} from '@ton/walletkit';

import { Base64String } from '../../walletkit/dist/cjs/types/primitive';

export class SwiftWalletAdapter implements IWalletAdapter {
    private swiftWalletAdapter;
    private client: ApiClient;

    constructor(swiftWalletAdapter: IWalletAdapter, client: ApiClient) {
        this.swiftWalletAdapter = swiftWalletAdapter;
        this.client = client;
    }

    getPublicKey(): Hex {
        return this.swiftWalletAdapter.getPublicKey();
    }

    getNetwork(): CHAIN {
        return this.swiftWalletAdapter.getNetwork();
    }

    getClient(): ApiClient {
        return this.client;
    }

    /** Get wallet's TON address */
    getAddress(options?: { testnet?: boolean }): string {
        return this.swiftWalletAdapter.getAddress(options);
    }

    /** Get state init for wallet deployment base64 encoded boc */
    async getStateInit(): Promise<Base64String> {
        return this.swiftWalletAdapter.getStateInit();
    }

    async getSignedSendTransaction(
        input: ConnectTransactionParamContent,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<string> {
        return this.swiftWalletAdapter.getSignedSendTransaction(input, options);
    }

    async getSignedSignData(
        input: PrepareSignDataResult,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hex> {
        return this.swiftWalletAdapter.getSignedSignData(input, options);
    }

    async getSignedTonProof(
        input: TonProofParsedMessage,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hex> {
        return this.swiftWalletAdapter.getSignedTonProof(input, options);
    }
}
