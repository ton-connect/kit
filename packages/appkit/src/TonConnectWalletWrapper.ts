/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// TonConnect wallet wrapper that implements TonWalletKit Wallet interface

import type { Builder, Cell } from '@ton/core';
import { Address, beginCell } from '@ton/core';
import type { ITonConnect, Wallet as TonConnectWallet } from '@tonconnect/sdk';
import { CHAIN } from '@tonconnect/protocol';
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
    Network,
    UserFriendlyAddress,
    Hex,
    Base64String,
    WalletId,
} from '@ton/walletkit';
import {
    CallForSuccess,
    isValidAddress,
    validateTransactionMessage,
    asHex,
    createWalletId,
    SendModeFlag,
    Result,
    ParseStack,
} from '@ton/walletkit';

import type { TonConnectWalletWrapper } from './types';

// Jetton transfer op code
const JETTON_TRANSFER_OP = 0xf8a7ea5;

interface JettonTransferMessage {
    queryId: bigint;
    amount: bigint;
    destination: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
}

function storeJettonTransferMessage(src: JettonTransferMessage) {
    return (builder: Builder) => {
        builder.storeUint(JETTON_TRANSFER_OP, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.destination);
        builder.storeAddress(src.responseDestination);
        builder.storeMaybeRef(src.customPayload);
        builder.storeCoins(src.forwardAmount ?? 0);
        builder.storeMaybeRef(src.forwardPayload);
    };
}

/**
 * Wrapper that makes a TonConnect wallet behave like a TonWalletKit wallet
 */
export class TonConnectWalletWrapperImpl implements TonConnectWalletWrapper {
    public readonly tonConnectWallet: TonConnectWallet;
    public readonly tonConnect: ITonConnect;
    public readonly client: ApiClient;

    constructor({
        tonConnectWallet,
        tonConnect,
        client,
    }: {
        tonConnectWallet: TonConnectWallet;
        tonConnect: ITonConnect;
        client: ApiClient;
    }) {
        this.tonConnectWallet = tonConnectWallet;
        this.tonConnect = tonConnect;
        this.client = client;
    }

    // === TonConnect-specific methods ===

    isConnected(): boolean {
        return true;
    }

    getConnectionInfo() {
        if (!this.isConnected()) {
            return null;
        }

        return {
            account: this.tonConnectWallet.account!,
            device: this.tonConnectWallet.device!,
        };
    }

    // === WalletAdapter implementation ===

    getPublicKey(): Hex {
        const account = this.tonConnectWallet.account;
        if (account?.publicKey) {
            return asHex(`0x${account.publicKey}`);
        }

        // Generate a deterministic public key from the address as fallback
        const address = Address.parse(account?.address || '');
        return asHex(`0x${address.hash.toString('hex')}`);
    }

    getNetwork(): Network {
        const account = this.tonConnectWallet.account;
        return account?.chain === CHAIN.TESTNET ? { chainId: CHAIN.TESTNET } : { chainId: CHAIN.MAINNET };
    }

    getClient(): ApiClient {
        return this.client;
    }

    getAddress(_options?: { testnet?: boolean }): UserFriendlyAddress {
        const account = this.tonConnectWallet.account;
        if (!account) {
            throw new Error('Wallet not connected');
        }
        return account.address;
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

        // Convert TransactionRequest to TonConnect transaction format
        const transaction = {
            validUntil: input.validUntil || Math.floor(Date.now() / 1000) + 300,
            messages: input.messages.map((msg) => ({
                address: msg.address,
                amount: String(msg.amount),
                payload: msg.payload,
                stateInit: msg.stateInit,
            })),
            network: (input.network?.chainId as CHAIN) || CHAIN.MAINNET,
        };

        const result = await this.tonConnect.sendTransaction(transaction);
        return result.boc as Base64String;
    }

    async getSignedSignData(_input: PreparedSignData, _options?: { fakeSignature: boolean }): Promise<Hex> {
        throw new Error('Sign data not yet supported with TonConnect wrapper');
    }

    async getSignedTonProof(_input: ProofMessage, _options?: { fakeSignature: boolean }): Promise<Hex> {
        throw new Error('TON Proof not yet supported with TonConnect wrapper');
    }

    // === WalletTonInterface implementation ===

    async createTransferTonTransaction(params: TONTransferRequest): Promise<TransactionRequest> {
        const message: TransactionRequestMessage = {
            address: params.recipientAddress,
            amount: params.transferAmount,
            payload: params.payload,
            stateInit: params.stateInit,
            mode: params.mode,
            extraCurrency: params.extraCurrency,
        };

        // Add comment if provided
        if (params.comment) {
            const commentCell = beginCell();
            commentCell.storeUint(0, 32); // op code for comment
            commentCell.storeStringTail(params.comment);
            message.payload = commentCell.endCell().toBoc().toString('base64') as Base64String;
        }

        return {
            messages: [message],
            network: this.getNetwork(),
            validUntil: Math.floor(Date.now() / 1000) + 300,
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

            // Add comment if provided
            if (transfer.comment) {
                const commentCell = beginCell();
                commentCell.storeUint(0, 32);
                commentCell.storeStringTail(transfer.comment);
                message.payload = commentCell.endCell().toBoc().toString('base64') as Base64String;
            }

            return message;
        });

        return {
            messages,
            network: this.getNetwork(),
            validUntil: Math.floor(Date.now() / 1000) + 300,
            fromAddress: this.getAddress(),
        };
    }

    async getTransactionPreview(
        _data: TransactionRequest | Promise<TransactionRequest>,
    ): Promise<TransactionEmulatedPreview> {
        // For now, we'll return an error preview since TonConnect doesn't support emulation
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

    // === WalletJettonInterface implementation ===

    async createTransferJettonTransaction(params: JettonsTransferRequest): Promise<TransactionRequest> {
        // Validate input parameters
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

        // Get jetton wallet address for this user
        const jettonWalletAddress = await CallForSuccess(() => this.getJettonWalletAddress(params.jettonAddress));

        // Create forward payload for comment if provided
        const forwardPayload = params.comment
            ? beginCell().storeUint(0, 32).storeStringTail(params.comment).endCell()
            : null;

        // Create jetton transfer message payload
        const jettonPayload = beginCell()
            .store(
                storeJettonTransferMessage({
                    queryId: 0n,
                    amount,
                    destination: Address.parse(params.recipientAddress),
                    responseDestination: Address.parse(this.getAddress()),
                    customPayload: null,
                    forwardAmount: 1n, //1 nanoton default
                    forwardPayload: forwardPayload,
                }),
            )
            .endCell();

        // Create transaction message
        const message: TransactionRequestMessage = {
            address: jettonWalletAddress,
            amount: '50000000', // 0.05 TON for gas fees
            payload: jettonPayload.toBoc().toString('base64') as Base64String,
            stateInit: undefined,
            extraCurrency: undefined,
            mode: {
                flags: [SendModeFlag.IGNORE_ERRORS, SendModeFlag.PAY_GAS_SEPARATELY],
            },
        };

        // Validate the transaction message
        if (!validateTransactionMessage(message, false).isValid) {
            throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
        }

        return {
            messages: [message],
            fromAddress: this.getAddress(),
        };
    }

    async getJettonBalance(_jettonAddress: UserFriendlyAddress): Promise<TokenAmount> {
        throw new Error(
            'Jetton balance not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for jetton operations.',
        );
    }

    async getJettonWalletAddress(jettonAddress: UserFriendlyAddress): Promise<UserFriendlyAddress> {
        if (!isValidAddress(jettonAddress)) {
            throw new Error(`Invalid jetton address: ${jettonAddress}`);
        }

        try {
            // Create the stack item with the owner address as base64 encoded BOC
            const ownerAddressCell = beginCell().storeAddress(Address.parse(this.getAddress())).endCell();
            const stackParam = [{ type: 'slice' as const, value: ownerAddressCell.toBoc().toString('base64') }];

            // Call get_wallet_address method on jetton master contract
            const result = await this.client.runGetMethod(jettonAddress, 'get_wallet_address', stackParam);

            const parsedStack = ParseStack(result.stack);
            // Extract the jetton wallet address from the result
            const jettonWalletAddressResult =
                parsedStack[0].type === 'slice' || parsedStack[0].type === 'cell'
                    ? parsedStack[0].cell.asSlice().loadAddress()
                    : null;
            if (!jettonWalletAddressResult) {
                throw new Error('Failed to get jetton wallet address');
            }
            return jettonWalletAddressResult.toString();
        } catch (error) {
            throw new Error(
                `Failed to get jetton wallet address for ${jettonAddress}: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    async getJettons(_params?: JettonsRequest): Promise<JettonsResponse> {
        throw new Error(
            'Jettons listing not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for jetton operations.',
        );
    }

    // === WalletNftInterface implementation ===

    async createTransferNftTransaction(_params: NFTTransferRequest): Promise<TransactionRequest> {
        throw new Error(
            'NFT transfers not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for NFT operations.',
        );
    }

    async createTransferNftRawTransaction(_params: NFTRawTransferRequest): Promise<TransactionRequest> {
        throw new Error(
            'NFT transfers not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for NFT operations.',
        );
    }

    async getNfts(_params: NFTsRequest): Promise<NFTsResponse> {
        throw new Error(
            'NFT listing not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for NFT operations.',
        );
    }

    async getNft(_address: UserFriendlyAddress): Promise<NFT | null> {
        throw new Error(
            'NFT fetching not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for NFT operations.',
        );
    }
}
