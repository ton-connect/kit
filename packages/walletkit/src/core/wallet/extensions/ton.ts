/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { beginCell } from '@ton/core';

import { isValidAddress } from '../../../utils/address';
import { isValidNanotonAmount, validateTransactionMessage } from '../../../validation';
import { CallForSuccess } from '../../../utils/retry';
import type { ApiClient } from '../../../types/toncenter/ApiClient';
import { createTransactionPreview as createTransactionPreviewHelper } from '../../../utils/toncenterEmulation';
import { ERROR_CODES, WalletKitError } from '../../../errors';
import { globalLogger } from '../../Logger';
import type {
    TONTransferRequest,
    TransactionEmulatedPreview,
    TransactionRequest,
    TransactionRequestMessage,
    SendTransactionResponse,
    Base64String,
} from '../../../api/models';
import type { Wallet, WalletTonInterface } from '../../../api/interfaces';

const log = globalLogger.createChild('WalletTonClass');

export class WalletTonClass implements WalletTonInterface {
    client: ApiClient;

    private constructor(client: ApiClient) {
        this.client = client;
    }

    async createTransferTonTransaction(this: Wallet, param: TONTransferRequest): Promise<TransactionRequest> {
        if (!isValidAddress(param.recipientAddress)) {
            throw new Error(`Invalid to address: ${param.recipientAddress}`);
        }
        if (!isValidNanotonAmount(param.transferAmount)) {
            throw new Error(`Invalid amount: ${param.transferAmount}`);
        }

        let body: Base64String | undefined;
        if (param.payload) {
            body = param.payload;
        } else if (param.comment) {
            body = beginCell()
                .storeUint(0, 32)
                .storeStringTail(param.comment)
                .endCell()
                .toBoc()
                .toString('base64') as Base64String;
        }
        const message: TransactionRequestMessage = {
            address: param.recipientAddress,
            amount: param.transferAmount,
            payload: body,
            stateInit: param.stateInit,
            extraCurrency: param.extraCurrency,
            mode: param.mode,
        };

        if (!validateTransactionMessage(message, false).isValid) {
            throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
        }

        return {
            messages: [message],
            fromAddress: this.getAddress(),
        };
    }
    async createTransferMultiTonTransaction(this: Wallet, params: TONTransferRequest[]): Promise<TransactionRequest> {
        let messages: TransactionRequestMessage[] = [];
        for (const param of params) {
            if (!isValidAddress(param.recipientAddress)) {
                throw new Error(`Invalid to address: ${param.recipientAddress}`);
            }
            if (!isValidNanotonAmount(param.transferAmount)) {
                throw new Error(`Invalid amount: ${param.transferAmount}`);
            }

            let body: Base64String | undefined;
            if (param.payload) {
                body = param.payload;
            } else if (param.comment) {
                body = beginCell()
                    .storeUint(0, 32)
                    .storeStringTail(param.comment)
                    .endCell()
                    .toBoc()
                    .toString('base64') as Base64String;
            }
            const message: TransactionRequestMessage = {
                address: param.recipientAddress,
                amount: param.transferAmount,
                payload: body,
                stateInit: param.stateInit,
                extraCurrency: param.extraCurrency,
                mode: param.mode,
            };

            if (!validateTransactionMessage(message, false).isValid) {
                throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
            }

            messages.push(message);
        }
        return {
            messages,
            fromAddress: this.getAddress(),
        };
    }

    async getTransactionPreview(
        this: Wallet,
        param: TransactionRequest | Promise<TransactionRequest>,
    ): Promise<TransactionEmulatedPreview> {
        const transaction = await param;
        const preview = await CallForSuccess(() => createTransactionPreviewHelper(transaction, this));
        return preview;
    }

    async sendTransaction(this: Wallet, request: TransactionRequest): Promise<SendTransactionResponse> {
        try {
            const boc = await this.getSignedSendTransaction(request);

            await CallForSuccess(() => this.getClient().sendBoc(boc));

            return { boc };
        } catch (error) {
            log.error('Failed to send transaction', { error });

            if (error instanceof WalletKitError) {
                throw error;
            }
            if ((error as { message: string })?.message?.includes('Ledger device')) {
                throw new WalletKitError(ERROR_CODES.LEDGER_DEVICE_ERROR, 'Ledger device error', error as Error);
            }
            throw error;
        }
    }

    async getBalance(this: Wallet): Promise<string> {
        return await CallForSuccess(async () => this.getClient().getBalance(this.getAddress()));
    }
}
