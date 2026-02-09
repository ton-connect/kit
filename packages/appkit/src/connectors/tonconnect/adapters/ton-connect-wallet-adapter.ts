/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { Wallet as TonConnectWallet } from '@tonconnect/sdk';
import { CHAIN } from '@tonconnect/sdk';
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
import type { TonConnectUI } from '@tonconnect/ui';

import { getValidUntil } from '../utils/transaction';
import type { WalletInterface } from '../../../types/wallet';
import type { SignDataRequest, SignDataResponse } from '../../../types/signing';

/**
 * Configuration for TonConnectWalletAdapter
 */
export interface TonConnectWalletAdapterConfig {
    connectorId: string;
    tonConnectWallet: TonConnectWallet;
    tonConnect: TonConnectUI;
    client: ApiClient;
}

/**
 * Adapter that makes TonConnect wallet compatible with TonWalletKit interface
 */
export class TonConnectWalletAdapter implements WalletInterface {
    public readonly tonConnectWallet: TonConnectWallet;
    public readonly tonConnect: TonConnectUI;
    public readonly client: ApiClient;
    public readonly connectorId: string;

    constructor(config: TonConnectWalletAdapterConfig) {
        this.tonConnectWallet = config.tonConnectWallet;
        this.tonConnect = config.tonConnect;
        this.client = config.client;
        this.connectorId = config.connectorId;
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
            network: (input.network?.chainId as CHAIN) ?? this.tonConnectWallet.account?.chain,
        };

        const result = await this.tonConnect.sendTransaction(transaction);
        return result.boc as Base64String;
    }

    async signData(payload: SignDataRequest): Promise<SignDataResponse> {
        const chainId = payload.network
            ? this.mapNetworkToChain(payload.network)
            : (this.getNetwork().chainId as CHAIN);
        const { data } = payload;

        if (data.type === 'text') {
            const result = await this.tonConnect.signData({
                type: 'text',
                text: data.value.content,
                network: chainId,
                from: payload.from,
            });

            return {
                payload,
                address: result.address,
                timestamp: result.timestamp,
                domain: result.domain,
                signature: result.signature,
            };
        }

        if (data.type === 'binary') {
            const result = await this.tonConnect.signData({
                type: 'binary',
                bytes: data.value.content,
                network: chainId,
                from: payload.from,
            });

            return {
                payload,
                address: result.address,
                timestamp: result.timestamp,
                domain: result.domain,
                signature: result.signature,
            };
        }

        if (data.type === 'cell') {
            const result = await this.tonConnect.signData({
                type: 'cell',
                cell: data.value.content,
                schema: data.value.schema,
                network: chainId,
                from: payload.from,
            });

            return {
                payload,
                address: result.address,
                timestamp: result.timestamp,
                domain: result.domain,
                signature: result.signature,
            };
        }

        throw new Error('Unsupported payload type');
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

    private mapNetworkToChain(network: Network): CHAIN {
        switch (network.chainId) {
            case Network.mainnet().chainId:
                return CHAIN.MAINNET;
            case Network.testnet().chainId:
                return CHAIN.TESTNET;
            default:
                return network.chainId as CHAIN;
        }
    }
}
