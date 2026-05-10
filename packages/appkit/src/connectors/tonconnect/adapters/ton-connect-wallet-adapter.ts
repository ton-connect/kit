/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { Wallet as TonConnectWallet } from '@tonconnect/sdk';
import type { SignDataPayload as TonConnectSignDataPayload } from '@tonconnect/sdk';
import type { TonConnectUI } from '@tonconnect/ui';

import { Network } from '../../../types/network';
import type { Base64String, UserFriendlyAddress, Hex } from '../../../types/primitives';
import type { SignDataRequest, SignDataResponse } from '../../../types/signing';
import type { TransactionRequest, SendTransactionResponse } from '../../../types/transaction';
import type { WalletInterface } from '../../../types/wallet';
import { asHex, createWalletId, getNormalizedExtMessageHash } from '../../../utils';
import { getValidUntil } from '../utils/transaction';

/**
 * Configuration accepted by {@link TonConnectWalletAdapter} when wrapping a TonConnect wallet for AppKit.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export interface TonConnectWalletAdapterConfig {
    /** Id of the connector that produced this wallet — surfaced as `WalletInterface.connectorId`. */
    connectorId: string;
    /** Underlying TonConnect wallet object. */
    tonConnectWallet: TonConnectWallet;
    /** TonConnect UI instance used to drive `sendTransaction` and `signData` calls. */
    tonConnectUI: TonConnectUI;
}

/**
 * {@link WalletInterface} implementation backed by a TonConnect wallet. Built for you by {@link createTonConnectConnector} — apps interact with it through standard AppKit actions ({@link sendTransaction}, {@link signText}/{@link signBinary}/{@link signCell}); reads (balance, jettons, NFTs) go through AppKit actions using `appKit.networkManager`, not this adapter.
 *
 * @public
 * @category Class
 * @section Wallets
 */
export class TonConnectWalletAdapter implements WalletInterface {
    public readonly tonConnectWallet: TonConnectWallet;
    public readonly tonConnectUI: TonConnectUI;
    public readonly connectorId: string;

    /** @param config - {@link TonConnectWalletAdapterConfig} TonConnect wallet + UI instance and the id of the connector that produced them. */
    constructor(config: TonConnectWalletAdapterConfig) {
        this.tonConnectWallet = config.tonConnectWallet;
        this.tonConnectUI = config.tonConnectUI;
        this.connectorId = config.connectorId;
    }

    // ==========================================
    // Identity
    // ==========================================

    getAddress(): UserFriendlyAddress {
        const account = this.tonConnectWallet.account;
        if (!account) {
            throw new Error('Wallet not connected');
        }
        return Address.parse(account.address).toString();
    }

    getPublicKey(): Hex {
        const account = this.tonConnectWallet.account;
        if (account?.publicKey) {
            return asHex(`0x${account.publicKey}`);
        }
        throw new Error('Public key not found');
    }

    getNetwork(): Network {
        const account = this.tonConnectWallet.account;
        return Network.custom(account?.chain ?? Network.testnet().chainId);
    }

    getWalletId(): string {
        return createWalletId(this.getNetwork(), this.getAddress());
    }

    // ==========================================
    // Signing / Transactions
    // ==========================================

    async sendTransaction(request: TransactionRequest): Promise<SendTransactionResponse> {
        const transaction = {
            validUntil: request.validUntil || getValidUntil(),
            messages: request.messages.map((msg) => ({
                address: msg.address,
                amount: String(msg.amount),
                payload: msg.payload,
                stateInit: msg.stateInit,
            })),
            network: request.network?.chainId ?? this.tonConnectWallet.account?.chain,
        };

        const result = await this.tonConnectUI.sendTransaction(transaction);
        const { hash, boc: normalizedBoc } = getNormalizedExtMessageHash(result.boc);

        return {
            boc: result.boc as Base64String,
            normalizedBoc,
            normalizedHash: hash,
        };
    }

    async signData(payload: SignDataRequest): Promise<SignDataResponse> {
        const result = await this.tonConnectUI.signData(this.mapSignDataRequest(payload));

        return {
            payload,
            address: result.address,
            timestamp: result.timestamp,
            domain: result.domain,
            signature: result.signature,
        };
    }

    // ==========================================
    // Private helpers
    // ==========================================

    private mapSignDataRequest(request: SignDataRequest): TonConnectSignDataPayload {
        const chainId = request.network?.chainId ?? this.getNetwork().chainId;

        const { data } = request;

        if (data.type === 'text') {
            return {
                type: 'text',
                text: data.value.content,
                network: chainId,
                from: request.from,
            };
        }

        if (data.type === 'binary') {
            return {
                type: 'binary',
                bytes: data.value.content,
                network: chainId,
                from: request.from,
            };
        }

        if (data.type === 'cell') {
            return {
                type: 'cell',
                cell: data.value.content,
                schema: data.value.schema,
                network: chainId,
                from: request.from,
            };
        }

        throw new Error('Unsupported payload type');
    }
}
