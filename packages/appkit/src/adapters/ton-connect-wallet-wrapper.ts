/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { ITonConnect, SignDataPayload, SignDataPayloadCell, Wallet as TonConnectWallet } from '@tonconnect/sdk';
import type { CHAIN } from '@tonconnect/protocol';
import type {
    ApiClient,
    TONTransferRequest,
    TransactionRequest,
    TransactionRequestMessage,
    TransactionEmulatedPreview,
    SendTransactionResponse,
    JettonsRequest,
    JettonsResponse,
    JettonsTransferRequest,
    NFTsRequest,
    NFTsResponse,
    NFT,
    NFTTransferRequest,
    NFTRawTransferRequest,
    TokenAmount,
    PreparedSignData,
    ProofMessage,
    UserFriendlyAddress,
    Hex,
    Base64String,
    WalletId,
} from '@ton/walletkit';
import { Network } from '@ton/walletkit';
import {
    CallForSuccess,
    isValidAddress,
    asHex,
    createWalletId,
    Result,
    // Shared message builders
    createJettonTransferPayload,
    createNftTransferPayload,
    createNftTransferRawPayload,
    createCommentPayloadBase64,
    createTransferTransaction,
    DEFAULT_JETTON_GAS_FEE,
    DEFAULT_NFT_GAS_FEE,
    // Asset helpers
    getJettonWalletAddressFromClient,
    getJettonBalanceFromClient,
    getJettonsFromClient,
    getNftsFromClient,
    getNftFromClient,
} from '@ton/walletkit';

import type { TonConnectWalletWrapper, WalletConnectionInfo } from '../types';
import { getValidUntil } from '../utils';

/**
 * Configuration for TonConnectWalletWrapper
 */
export interface TonConnectWalletWrapperConfig {
    tonConnectWallet: TonConnectWallet;
    tonConnect: ITonConnect;
    client: ApiClient;
}

/**
 * Adapter that makes TonConnect wallet compatible with TonWalletKit interface
 */
export class TonConnectWalletWrapperImpl implements TonConnectWalletWrapper {
    public readonly tonConnectWallet: TonConnectWallet;
    public readonly tonConnect: ITonConnect;
    public readonly client: ApiClient;

    constructor(config: TonConnectWalletWrapperConfig) {
        this.tonConnectWallet = config.tonConnectWallet;
        this.tonConnect = config.tonConnect;
        this.client = config.client;
    }

    // ==========================================
    // TonConnect-specific methods
    // ==========================================

    isConnected(): boolean {
        return true;
    }

    getConnectionInfo(): WalletConnectionInfo | null {
        if (!this.isConnected()) {
            return null;
        }

        return {
            account: this.tonConnectWallet.account!,
            device: this.tonConnectWallet.device!,
        };
    }

    // ==========================================
    // WalletAdapter implementation
    // ==========================================

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

    getClient(): ApiClient {
        return this.client;
    }

    getAddress(_options?: { testnet?: boolean }): UserFriendlyAddress {
        const account = this.tonConnectWallet.account;
        if (!account) {
            throw new Error('Wallet not connected');
        }
        return Address.parse(account.address).toString();
    }

    getWalletId(): WalletId {
        return createWalletId(this.getNetwork(), this.getAddress());
    }

    async getStateInit(): Promise<Base64String> {
        const account = this.tonConnectWallet.account;
        if (!account) {
            throw new Error('Wallet not connected');
        }
        return account.walletStateInit as Base64String;
    }

    async getSignedSendTransaction(
        input: TransactionRequest,
        options?: { fakeSignature: boolean },
    ): Promise<Base64String> {
        if (options?.fakeSignature) {
            throw new Error('Fake signature not supported with TonConnect wallet');
        }

        const transaction = {
            validUntil: input.validUntil || getValidUntil(),
            messages: input.messages.map((msg) => ({
                address: msg.address,
                amount: String(msg.amount),
                payload: msg.payload,
                stateInit: msg.stateInit,
            })),
            network: (input.network?.chainId as CHAIN) ?? (this.tonConnectWallet.account?.chain as CHAIN),
        };

        const result = await this.tonConnect.sendTransaction(transaction);
        return result.boc as Base64String;
    }

    async getSignedSignData(input: PreparedSignData, _options?: { fakeSignature: boolean }): Promise<Hex> {
        if (_options?.fakeSignature) {
            throw new Error('Fake signature not supported with TonConnect wallet');
        }

        const payload: SignDataPayload = {
            network: input.payload.network ? (input.payload.network.chainId as CHAIN) : undefined,
            from: this.getAddress(),
            ...(input.payload.data.type === 'text'
                ? { type: 'text' as const, text: input.payload.data.value.content }
                : {}),
            ...(input.payload.data.type === 'cell'
                ? {
                      type: 'cell' as const,
                      schema: input.payload.data.value.schema,
                      cell: input.payload.data.value.content,
                  }
                : {}),
            ...(input.payload.data.type === 'binary'
                ? { type: 'binary' as const, bytes: input.payload.data.value.content }
                : {}),
        } as SignDataPayloadCell;
        const response = await this.tonConnect.signData(payload);
        return asHex(response.signature);
    }

    async getSignedTonProof(_input: ProofMessage, _options?: { fakeSignature: boolean }): Promise<Hex> {
        throw new Error('TON Proof not yet supported with TonConnect wrapper');
    }

    // ==========================================
    // WalletTonInterface implementation
    // ==========================================

    async createTransferTonTransaction(params: TONTransferRequest): Promise<TransactionRequest> {
        const message: TransactionRequestMessage = {
            address: params.recipientAddress,
            amount: params.transferAmount,
            payload: params.payload,
            stateInit: params.stateInit,
            mode: params.mode,
            extraCurrency: params.extraCurrency,
        };

        if (params.comment) {
            message.payload = createCommentPayloadBase64(params.comment);
        }

        return {
            messages: [message],
            network: this.getNetwork(),
            validUntil: getValidUntil(),
            fromAddress: this.getAddress(),
        };
    }

    async createTransferMultiTonTransaction(params: [TONTransferRequest]): Promise<TransactionRequest> {
        const messages: TransactionRequestMessage[] = params.map((transfer) => {
            const message: TransactionRequestMessage = {
                address: transfer.recipientAddress,
                amount: transfer.transferAmount,
                payload: transfer.payload,
                stateInit: transfer.stateInit,
                mode: transfer.mode,
                extraCurrency: transfer.extraCurrency,
            };

            if (transfer.comment) {
                message.payload = createCommentPayloadBase64(transfer.comment);
            }

            return message;
        });

        return {
            messages,
            network: this.getNetwork(),
            validUntil: getValidUntil(),
            fromAddress: this.getAddress(),
        };
    }

    async getTransactionPreview(
        _data: TransactionRequest | Promise<TransactionRequest>,
    ): Promise<TransactionEmulatedPreview> {
        return {
            result: Result.failure,
            error: {
                message: 'Transaction preview not supported with TonConnect wrapper',
            },
        };
    }

    async sendTransaction(request: TransactionRequest): Promise<SendTransactionResponse> {
        const boc = await this.getSignedSendTransaction(request);
        return { boc };
    }

    async getBalance(): Promise<TokenAmount> {
        const address = Address.parse(this.getAddress());
        return await this.client.getBalance(address.toString());
    }

    // ==========================================
    // WalletJettonInterface implementation
    // ==========================================

    async createTransferJettonTransaction(params: JettonsTransferRequest): Promise<TransactionRequest> {
        if (!isValidAddress(params.recipientAddress)) {
            throw new Error(`Invalid recipient address: ${params.recipientAddress}`);
        }
        if (!isValidAddress(params.jettonAddress)) {
            throw new Error(`Invalid jetton address: ${params.jettonAddress}`);
        }

        const amount =
            typeof params.transferAmount === 'bigint'
                ? params.transferAmount
                : BigInt(params.transferAmount as unknown as string);
        if (amount <= 0n) {
            throw new Error(`Invalid amount: ${params.transferAmount}`);
        }

        const jettonWalletAddress = await CallForSuccess(() => this.getJettonWalletAddress(params.jettonAddress));

        const jettonPayload = createJettonTransferPayload({
            amount,
            destination: params.recipientAddress,
            responseDestination: this.getAddress(),
            comment: params.comment,
        });

        return createTransferTransaction({
            targetAddress: jettonWalletAddress,
            amount: DEFAULT_JETTON_GAS_FEE,
            payload: jettonPayload,
            fromAddress: this.getAddress(),
        });
    }

    async getJettonBalance(jettonAddress: UserFriendlyAddress): Promise<TokenAmount> {
        const jettonWalletAddress = await this.getJettonWalletAddress(jettonAddress);
        return getJettonBalanceFromClient(this.client, jettonWalletAddress);
    }

    async getJettonWalletAddress(jettonAddress: UserFriendlyAddress): Promise<UserFriendlyAddress> {
        return getJettonWalletAddressFromClient(this.client, jettonAddress, this.getAddress());
    }

    async getJettons(params?: JettonsRequest): Promise<JettonsResponse> {
        return getJettonsFromClient(this.client, this.getAddress(), params);
    }

    // ==========================================
    // WalletNftInterface implementation
    // ==========================================

    async createTransferNftTransaction(params: NFTTransferRequest): Promise<TransactionRequest> {
        if (!isValidAddress(params.nftAddress)) {
            throw new Error(`Invalid NFT address: ${params.nftAddress}`);
        }
        if (!isValidAddress(params.recipientAddress)) {
            throw new Error(`Invalid recipient address: ${params.recipientAddress}`);
        }

        const nftPayload = createNftTransferPayload({
            newOwner: params.recipientAddress,
            responseDestination: this.getAddress(),
            comment: params.comment,
        });

        return createTransferTransaction({
            targetAddress: params.nftAddress,
            amount: params.transferAmount?.toString() ?? DEFAULT_NFT_GAS_FEE,
            payload: nftPayload,
            fromAddress: this.getAddress(),
        });
    }

    async createTransferNftRawTransaction(params: NFTRawTransferRequest): Promise<TransactionRequest> {
        if (!isValidAddress(params.nftAddress)) {
            throw new Error(`Invalid NFT address: ${params.nftAddress}`);
        }

        const nftPayload = createNftTransferRawPayload({
            queryId: params.message.queryId,
            newOwner: params.message.newOwner,
            responseDestination: params.message.responseDestination,
            customPayload: params.message.customPayload,
            forwardAmount: params.message.forwardAmount,
            forwardPayload: params.message.forwardPayload,
        });

        return createTransferTransaction({
            targetAddress: params.nftAddress,
            amount: params.transferAmount.toString(),
            payload: nftPayload,
            fromAddress: this.getAddress(),
        });
    }

    async getNfts(params: NFTsRequest): Promise<NFTsResponse> {
        return getNftsFromClient(this.client, this.getAddress(), params);
    }

    async getNft(address: UserFriendlyAddress): Promise<NFT | null> {
        return getNftFromClient(this.client, address);
    }
}
