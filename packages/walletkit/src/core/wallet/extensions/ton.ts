import { beginCell, Address } from '@ton/core';

import { TransactionPreview, WalletInterface } from '../../../types';
import { ConnectTransactionParamContent, ConnectTransactionParamMessage } from '../../../types/internal';
import { WalletTonInterface, TonTransferParams, TonTransferManyParams } from '../../../types/wallet';
import { isValidAddress } from '../../../utils/address';
import { isValidNanotonAmount, validateTransactionMessage } from '../../../validation';
import { CallForSuccess } from '../../../utils/retry';
import { EmulationErrorUnknown } from '../../../types/emulation/errors';

export class WalletTonClass implements WalletTonInterface {
    async createTransferTonTransaction(
        this: WalletInterface,
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
        this: WalletInterface,
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
        this: WalletInterface,
        _param: ConnectTransactionParamContent | Promise<ConnectTransactionParamContent>,
    ): Promise<{
        preview: TransactionPreview;
    }> {
        return {
            preview: {
                result: 'error',
                emulationError: new EmulationErrorUnknown('Unknown emulation error'),
            },
        };
    }

    async getBalance(this: WalletInterface): Promise<bigint> {
        return await CallForSuccess(() => this.client.getBalance(Address.parse(this.getAddress())));
    }
}
