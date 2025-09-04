import { beginCell, Address } from '@ton/core';

import { WalletInterface } from '../../../types';
import { ConnectTransactionParamContent, ConnectTransactionParamMessage } from '../../../types/internal';
import { WalletTonInterface, TonTransferParams } from '../../../types/wallet';
import { isValidAddress } from '../../../utils/address';
import { isValidNanotonAmount, validateTransactionMessage } from '../../../validation';

export class WalletTonClass implements WalletTonInterface {
    async createSendTon(
        this: WalletInterface,
        { messages: params }: TonTransferParams,
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
    getBalance(this: WalletInterface): Promise<bigint> {
        return this.client.getBalance(Address.parse(this.getAddress()));
    }
}
