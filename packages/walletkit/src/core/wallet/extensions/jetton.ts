/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { storeJettonTransferMessage } from '@ton-community/assets-sdk';
import { Address, beginCell, SendMode } from '@ton/core';

import { IWallet } from '../../../types';
import { WalletJettonInterface } from '../../../types/wallet';
import { JettonTransferParams } from '../../../types/jettons';
import { validateTransactionMessage } from '../../../validation';
import { ConnectTransactionParamContent, ConnectTransactionParamMessage } from '../../../types/internal';
import { isValidAddress } from '../../../utils/address';
import { CallForSuccess } from '../../../utils/retry';
import { ParseStack, SerializeStack } from '../../../utils/tvmStack';
import { ResponseUserJettons } from '../../../types/export/responses/jettons';
import { GetJettonsByOwnerRequest } from '../../../types/toncenter/ApiClient';

export class WalletJettonClass implements WalletJettonInterface {
    async createTransferJettonTransaction(
        this: IWallet,
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

    async getJettonBalance(this: IWallet, jettonAddress: string): Promise<string> {
        // Get jetton wallet address for this user
        const jettonWalletAddress = await this.getJettonWalletAddress(jettonAddress);

        // Get the jetton wallet contract and query balance
        try {
            const result = await this.getClient().runGetMethod(Address.parse(jettonWalletAddress), 'get_wallet_data');

            // The balance is the first return value from get_wallet_data
            const parsedStack = ParseStack(result.stack);
            const balance = parsedStack[0].type === 'int' ? parsedStack[0].value : 0n;
            return balance.toString();
        } catch (_error) {
            // Failed to get jetton balance, return 0
            return '0';
        }
    }

    async getJettonWalletAddress(this: IWallet, jettonAddress: string): Promise<string> {
        if (!isValidAddress(jettonAddress)) {
            throw new Error(`Invalid jetton address: ${jettonAddress}`);
        }

        try {
            // Call get_wallet_address method on jetton master contract
            const result = await this.getClient().runGetMethod(
                Address.parse(jettonAddress),
                'get_wallet_address',
                SerializeStack([
                    { type: 'slice', cell: beginCell().storeAddress(Address.parse(this.getAddress())).endCell() },
                ]),
            );

            const parsedStack = ParseStack(result.stack);
            // Extract the jetton wallet address from the result
            const jettonWalletAddress =
                parsedStack[0].type === 'slice' || parsedStack[0].type === 'cell'
                    ? parsedStack[0].cell.asSlice().loadAddress()
                    : null;
            if (!jettonWalletAddress) {
                throw new Error('Failed to get jetton wallet address');
            }
            return jettonWalletAddress.toString();
        } catch (error) {
            throw new Error(
                `Failed to get jetton wallet address for ${jettonAddress}: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    async getJettons(
        this: IWallet,
        params?: Omit<GetJettonsByOwnerRequest, 'ownerAddress'>,
    ): Promise<ResponseUserJettons> {
        return this.getClient().jettonsByOwnerAddress({
            ...params,

            ownerAddress: this.getAddress(),
        });
    }
}
