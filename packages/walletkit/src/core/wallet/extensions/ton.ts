import { beginCell, Address } from '@ton/core';

import { TransactionPreview, IWallet } from '../../../types';
import { ConnectTransactionParamContent, ConnectTransactionParamMessage } from '../../../types/internal';
import { WalletTonInterface, TonTransferParams, TonTransferManyParams } from '../../../types/wallet';
import { isValidAddress } from '../../../utils/address';
import { isValidNanotonAmount, validateTransactionMessage } from '../../../validation';
import { CallForSuccess } from '../../../utils/retry';
import { EmulationErrorUnknown } from '../../../types/emulation/errors';
import { ApiClient } from '../../../types/toncenter/ApiClient';

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
        const _transaction = await param;
        return {
            preview: {
                result: 'error',
                emulationError: new EmulationErrorUnknown('Unknown emulation error'),
            },
        };
    }

    async getBalance(this: IWallet): Promise<string> {
        return await CallForSuccess(async () => this.client.getBalance(Address.parse(this.getAddress())));
    }
}
