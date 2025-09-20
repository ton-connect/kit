// TonConnect wallet wrapper that implements TonWalletKit WalletInterface

import { storeJettonTransferMessage } from '@ton-community/assets-sdk';
import { Address, beginCell, SendMode } from '@ton/core';
import TonConnect, { Wallet } from '@tonconnect/sdk';
import { CHAIN } from '@tonconnect/protocol';
import {
    TonTransferParams,
    TonTransferManyParams,
    JettonTransferParams,
    ConnectTransactionParamContent,
    TransactionPreview,
    ApiClient,
    PrepareSignDataResult,
    TonProofParsedMessage,
    Hash,
    NftItems,
    NftItem,
    NftTransferParamsHuman,
    NftTransferParamsRaw,
    CallForSuccess,
    ConnectTransactionParamMessage,
    isValidAddress,
    validateTransactionMessage,
} from '@ton/walletkit';

import { TonConnectWalletWrapper } from './types';
// import { NftTransferParamsHuman, NftTransferParamsRaw } from '../../walletkit/src/types/nfts';
// import { LimitRequest } from '../../walletkit/src/core/ApiClientToncenter';

export interface LimitRequest {
    limit?: number;
    offset?: number;
}

/**
 * Wrapper that makes a TonConnect wallet behave like a TonWalletKit wallet
 */
export class TonConnectWalletWrapperImpl implements TonConnectWalletWrapper {
    public readonly tonConnectWallet: Wallet;
    public readonly tonConnect: TonConnect;
    public readonly client: ApiClient;
    constructor({
        tonConnectWallet,
        tonConnect,
        client,
    }: {
        tonConnectWallet: Wallet;
        tonConnect: TonConnect;
        client: ApiClient;
    }) {
        this.tonConnectWallet = tonConnectWallet;
        this.tonConnect = tonConnect;
        this.client = client;
        // if (!this.isConnected()) {
        //     throw new Error('TonConnect wallet must be connected before wrapping');
        // }
    }

    // === TonConnect-specific methods ===

    isConnected(): boolean {
        return true; //this.tonConnectWallet.connected;
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

    // === WalletInitInterface implementation ===

    get publicKey(): Uint8Array {
        // TonConnect doesn't provide direct access to public key
        // We'll try to derive it from the wallet state init or use a placeholder
        const account = this.tonConnectWallet.account;
        if (account?.publicKey) {
            return Buffer.from(account.publicKey, 'hex');
        }

        // Generate a deterministic public key from the address as fallback
        const address = Address.parse(account?.address || '');
        return address.hash;
    }

    get version(): string {
        // TonConnect doesn't provide version info, so we'll use a default
        return 'unknown';
    }

    // get client(): ApiClient {
    //     return this.walletKit.getTonClient();
    // }

    getNetwork(): CHAIN {
        const account = this.tonConnectWallet.account;
        return account?.chain === CHAIN.TESTNET ? CHAIN.TESTNET : CHAIN.MAINNET;
    }

    getAddress(_options?: { testnet?: boolean }): string {
        const account = this.tonConnectWallet.account;
        if (!account) {
            throw new Error('Wallet not connected');
        }
        return account.address;
    }

    async getStateInit(): Promise<string> {
        const account = this.tonConnectWallet.account;
        if (!account) {
            throw new Error('Wallet not connected');
        }
        return account.walletStateInit;
    }

    async getSignedSendTransaction(
        input: ConnectTransactionParamContent,
        _options?: { fakeSignature?: boolean },
    ): Promise<string> {
        if (_options?.fakeSignature) {
            // For preview purposes, we can't really create a fake signature with TonConnect
            throw new Error('Fake signature not supported with TonConnect wallet');
        }

        // Convert ConnectTransactionParamContent to TonConnect transaction format
        const transaction = {
            validUntil: input.validUntil || Math.floor(Date.now() / 1000) + 300,
            messages: input.messages.map((msg) => ({
                address: msg.address,
                amount: msg.amount,
                payload: msg.payload,
                stateInit: msg.stateInit,
            })),
            network: input.network || CHAIN.MAINNET,
        };

        // Send transaction through TonConnect
        // const result = await this.tonConnectWallet.sendTransaction(transaction);
        const result = await this.tonConnect.sendTransaction(transaction);
        return result.boc;
    }

    async getSignedSignData(_input: PrepareSignDataResult, _options?: { fakeSignature?: boolean }): Promise<Hash> {
        throw new Error('Sign data not yet supported with TonConnect wrapper');
    }

    async getSignedTonProof(_input: TonProofParsedMessage, _options?: { fakeSignature?: boolean }): Promise<Hash> {
        throw new Error('TON Proof not yet supported with TonConnect wrapper');
    }

    // === WalletTonInterface implementation ===

    async createTransferTonTransaction(params: TonTransferParams): Promise<ConnectTransactionParamContent> {
        // Convert TonTransferParams to ConnectTransactionParamContent
        const message = {
            address: params.toAddress,
            amount: params.amount,
            payload: params.body,
            stateInit: params.stateInit,
        };

        // Add comment if provided
        if (params.comment) {
            // Convert comment to payload
            const commentCell = beginCell();
            commentCell.storeUint(0, 32); // op code for comment
            commentCell.storeStringTail(params.comment);
            message.payload = commentCell.endCell().toBoc().toString('base64');
        }

        return {
            messages: [message],
            network: this.getNetwork(),
            validUntil: Math.floor(Date.now() / 1000) + 300,
            from: this.getAddress(),
        };
    }

    async createTransferMultiTonTransaction(params: TonTransferManyParams): Promise<ConnectTransactionParamContent> {
        // Convert multiple transfers
        const messages = params.messages.map((transfer) => {
            const message = {
                address: transfer.toAddress,
                amount: transfer.amount,
                payload: transfer.body,
                stateInit: transfer.stateInit,
            };

            // Add comment if provided
            if (transfer.comment) {
                const commentCell = beginCell();
                commentCell.storeUint(0, 32);
                commentCell.storeStringTail(transfer.comment);
                message.payload = commentCell.endCell().toBoc().toString('base64');
            }

            return message;
        });

        return {
            messages,
            network: this.getNetwork(),
            validUntil: Math.floor(Date.now() / 1000) + 300,
            from: this.getAddress(),
        };
    }

    async getTransactionPreview(
        _data: ConnectTransactionParamContent | Promise<ConnectTransactionParamContent>,
    ): Promise<{ preview: TransactionPreview }> {
        // For now, we'll create a basic preview
        // const resolvedData = await Promise.resolve(data);
        // const preview: TransactionPreview = {
        //     type: TransactionPreviewType.TonTransfer,
        //     from: this.getAddress(),
        //     messages: resolvedData.messages.map((msg) => ({
        //         to: msg.address,
        //         amount: msg.amount,
        //         payload: msg.payload,
        //         stateInit: msg.stateInit,
        //     })),
        //     totalAmount: resolvedData.messages.reduce((sum, msg) => sum + BigInt(msg.amount), BigInt(0)).toString(),
        //     estimatedFee: '10000000', // Placeholder fee
        // };

        return {
            preview: {
                result: 'error',
                emulationError: new Error('Unknown emulation error'),
            },
        };
    }

    async getBalance(): Promise<bigint> {
        // We need to use the walletKit's client to get balance
        const address = Address.parse(this.getAddress());
        return await this.client.getBalance(address);
    }

    // === WalletJettonInterface implementation ===

    async createTransferJettonTransaction(
        jettonTransferParams: JettonTransferParams,
    ): Promise<ConnectTransactionParamContent> {
        // Validate input parameters
        if (!isValidAddress(jettonTransferParams.toAddress)) {
            throw new Error(`Invalid to address: ${jettonTransferParams.toAddress}`);
        }
        if (!isValidAddress(jettonTransferParams.jettonAddress)) {
            throw new Error(`Invalid jetton address: ${jettonTransferParams.jettonAddress}`);
        }
        if (!jettonTransferParams.amount || BigInt(jettonTransferParams.amount) <= 0n) {
            throw new Error(`Invalid amount: ${jettonTransferParams.amount}`);
        }

        // Get jetton wallet address for this user
        const jettonWalletAddress = await CallForSuccess(() =>
            this.getJettonWalletAddress(jettonTransferParams.jettonAddress),
        );

        // Create forward payload for comment if provided
        const forwardPayload = jettonTransferParams.comment
            ? beginCell().storeUint(0, 32).storeStringTail(jettonTransferParams.comment).endCell()
            : null;

        // Create jetton transfer message payload
        const jettonPayload = beginCell()
            .store(
                storeJettonTransferMessage({
                    queryId: 0n,
                    amount: BigInt(jettonTransferParams.amount),
                    destination: Address.parse(jettonTransferParams.toAddress),
                    responseDestination: Address.parse(this.getAddress()),
                    customPayload: null,
                    forwardAmount: 1n, //1 nanoton default
                    forwardPayload: forwardPayload,
                }),
            )
            .endCell();

        // Create transaction message
        const message: ConnectTransactionParamMessage = {
            address: jettonWalletAddress,
            amount: '50000000', // 0.05 TON for gas fees
            payload: jettonPayload.toBoc().toString('base64'),
            stateInit: undefined,
            extraCurrency: undefined,
            mode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        };

        // Validate the transaction message
        if (!validateTransactionMessage(message, false).isValid) {
            throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
        }

        return {
            messages: [message],
            from: this.getAddress(),
        };
    }

    async getJettonBalance(_jettonAddress: string): Promise<bigint> {
        throw new Error(
            'Jetton balance not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for jetton operations.',
        );
    }

    async getJettonWalletAddress(jettonAddress: string): Promise<string> {
        if (!isValidAddress(jettonAddress)) {
            throw new Error(`Invalid jetton address: ${jettonAddress}`);
        }

        try {
            // Call get_wallet_address method on jetton master contract
            const result = await this.client.runGetMethod(Address.parse(jettonAddress), 'get_wallet_address', [
                { type: 'slice', cell: beginCell().storeAddress(Address.parse(this.getAddress())).endCell() },
            ]);

            // Extract the jetton wallet address from the result
            const jettonWalletAddress = result.stack.readAddress();
            return jettonWalletAddress.toString();
        } catch (error) {
            throw new Error(
                `Failed to get jetton wallet address for ${jettonAddress}: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    // === WalletNftInterface implementation ===

    async createTransferNftTransaction(_params: NftTransferParamsHuman): Promise<ConnectTransactionParamContent> {
        throw new Error(
            'NFT transfers not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for NFT operations.',
        );
    }

    async createTransferNftRawTransaction(_params: NftTransferParamsRaw): Promise<ConnectTransactionParamContent> {
        throw new Error(
            'NFT transfers not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for NFT operations.',
        );
    }

    async getNfts(_params: LimitRequest): Promise<NftItems> {
        throw new Error(
            'NFT listing not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for NFT operations.',
        );
    }

    async getNft(_address: Address | string): Promise<NftItem | null> {
        throw new Error(
            'NFT fetching not yet implemented in TonConnect wrapper. Use a full TonWalletKit wallet for NFT operations.',
        );
    }
}
