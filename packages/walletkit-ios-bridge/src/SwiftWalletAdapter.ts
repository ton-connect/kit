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
} from '@ton/walletkit';

import { ApiClient } from '../../../walletkit/src';

export class SwiftWalletAdapter implements IWalletAdapter {
    private swiftWalletAdapter;
    readonly client: ApiClient;

    publicKey: Hex;
    version: string;

    constructor(swiftWalletAdapter: IWalletAdapter, client: ApiClient) {
        this.swiftWalletAdapter = swiftWalletAdapter;
        this.publicKey = this.swiftWalletAdapter.publicKey;
        this.version = this.swiftWalletAdapter.version;
        this.client = client;
    }

    getNetwork(): CHAIN {
        return this.swiftWalletAdapter.getNetwork;
    }

    /** Get wallet's TON address */
    getAddress(options?: { testnet?: boolean }): string {
        return this.swiftWalletAdapter.getAddress(options);
    }

    /** Get state init for wallet deployment base64 encoded boc */
    async getStateInit(): Promise<string> {
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
