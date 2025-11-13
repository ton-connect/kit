/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { beginCell, Address } from '@ton/core';

import { TransactionPreview, IWallet } from '../../../types';
import { ConnectTransactionParamContent, ConnectTransactionParamMessage } from '../../../types/internal';
import { WalletTonInterface, TonTransferParams, TonTransferManyParams } from '../../../types/wallet';
import { isValidAddress } from '../../../utils/address';
import { isValidNanotonAmount, validateTransactionMessage } from '../../../validation';
import { CallForSuccess } from '../../../utils/retry';
import { ApiClient } from '../../../types/toncenter/ApiClient';
import { createTransactionPreview as createTransactionPreviewHelper } from '../../../utils/toncenterEmulation';
import { EventTransactionResponse } from '../../../types/events';
import { ERROR_CODES, WalletKitError } from '../../../errors';
import { globalLogger } from '../../Logger';

const log = globalLogger.createChild('WalletTonClass');

export class WalletTonClass implements WalletTonInterface {
    client: ApiClient;

    private constructor(client: ApiClient) {
        this.client = client;
    }

    async createTransferTonTransaction(
        this: IWallet,
        param: TonTransferParams,
    ): Promise<ConnectTransactionParamContent> {
        let messages: ConnectTransactionParamMessage[] = [];
        if (!isValidAddress(param.toAddress)) {
            throw new Error(`Invalid to address: ${param.toAddress}`);
        }
        if (!isValidNanotonAmount(param.amount)) {
            throw new Error(`Invalid amount: ${param.amount}`);
        }

        let body;
        if (param.body) {
            body = param.body;
        } else if (param.comment) {
            body = beginCell().storeUint(0, 32).storeStringTail(param.comment).endCell().toBoc().toString('base64');
        }
        const message: ConnectTransactionParamMessage = {
            address: param.toAddress,
            amount: param.amount,
            payload: body,
            stateInit: param.stateInit,
            extraCurrency: param.extraCurrency,
            mode: param.mode,
        };

        if (!validateTransactionMessage(message, false).isValid) {
            throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
        }

        messages.push(message);
        return {
            messages,
            from: this.getAddress(),
        };
    }
    async createTransferMultiTonTransaction(
        this: IWallet,
        { messages: params }: TonTransferManyParams,
    ): Promise<ConnectTransactionParamContent> {
        let messages: ConnectTransactionParamMessage[] = [];
        for (const param of params) {
            if (!isValidAddress(param.toAddress)) {
                throw new Error(`Invalid to address: ${param.toAddress}`);
            }
            if (!isValidNanotonAmount(param.amount)) {
                throw new Error(`Invalid amount: ${param.amount}`);
            }

            let body;
            if (param.body) {
                body = param.body;
            } else if (param.comment) {
                body = beginCell().storeUint(0, 32).storeStringTail(param.comment).endCell().toBoc().toString('base64');
            }
            const message: ConnectTransactionParamMessage = {
                address: param.toAddress,
                amount: param.amount,
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
            from: this.getAddress(),
        };
    }

    async getTransactionPreview(
        this: IWallet,
        param: ConnectTransactionParamContent | Promise<ConnectTransactionParamContent>,
    ): Promise<{
        preview: TransactionPreview;
    }> {
        const transaction = await param;
        const preview = await CallForSuccess(() => createTransactionPreviewHelper(transaction, this));
        return {
            preview,
        };
    }

    async sendTransaction(this: IWallet, request: ConnectTransactionParamContent): Promise<EventTransactionResponse> {
        try {
            const signedBoc = await this.getSignedSendTransaction(request);

            // if (!this.walletKitOptions.dev?.disableNetworkSend) {
            await CallForSuccess(() => this.getClient().sendBoc(Buffer.from(signedBoc, 'base64')));
            // }

            return { signedBoc };
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

    async getBalance(this: IWallet): Promise<string> {
        return await CallForSuccess(async () => this.getClient().getBalance(Address.parse(this.getAddress())));
    }
}
