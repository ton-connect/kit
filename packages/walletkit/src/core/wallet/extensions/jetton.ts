/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Builder, Cell } from '@ton/core';
import { Address, beginCell } from '@ton/core';

import { validateTransactionMessage } from '../../../validation';
import { asAddressFriendly, isValidAddress } from '../../../utils/address';
import { CallForSuccess } from '../../../utils/retry';
import { ParseStack, SerializeStack } from '../../../utils/tvmStack';
import type { Wallet, WalletJettonInterface } from '../../../api/interfaces';
import type {
    Base64String,
    JettonsRequest,
    JettonsResponse,
    JettonsTransferRequest,
    TokenAmount,
    TransactionRequest,
    TransactionRequestMessage,
    UserFriendlyAddress,
} from '../../../api/models';
import { SendModeFlag } from '../../../api/models';
import { OpCode } from '../../../types/toncenter/parsers';

export interface JettonTransferMessage {
    queryId: bigint;
    amount: bigint;
    destination: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
}

export function storeJettonTransferMessage(src: JettonTransferMessage) {
    return (builder: Builder) => {
        builder.storeUint(Number(OpCode.JettonTransfer), 32);
        builder.storeUint(src.queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.destination);
        builder.storeAddress(src.responseDestination);
        builder.storeMaybeRef(src.customPayload);
        builder.storeCoins(src.forwardAmount ?? 0);
        builder.storeMaybeRef(src.forwardPayload);
    };
}

export class WalletJettonClass implements WalletJettonInterface {
    async createTransferJettonTransaction(
        this: Wallet,
        jettonTransferParams: JettonsTransferRequest,
    ): Promise<TransactionRequest> {
        // Validate input parameters
        if (!isValidAddress(jettonTransferParams.recipientAddress)) {
            throw new Error(`Invalid to address: ${jettonTransferParams.recipientAddress}`);
        }
        if (!isValidAddress(jettonTransferParams.jettonAddress)) {
            throw new Error(`Invalid jetton address: ${jettonTransferParams.jettonAddress}`);
        }
        if (!jettonTransferParams.transferAmount || BigInt(jettonTransferParams.transferAmount) <= 0n) {
            throw new Error(`Invalid amount: ${jettonTransferParams.transferAmount}`);
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
                    amount: BigInt(jettonTransferParams.transferAmount),
                    destination: Address.parse(jettonTransferParams.recipientAddress),
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

    async getJettonBalance(this: Wallet, jettonAddress: UserFriendlyAddress): Promise<TokenAmount> {
        // Get jetton wallet address for this user
        const jettonWalletAddress = await this.getJettonWalletAddress(jettonAddress);

        // Get the jetton wallet contract and query balance
        try {
            const result = await this.getClient().runGetMethod(jettonWalletAddress, 'get_wallet_data');

            // The balance is the first return value from get_wallet_data
            const parsedStack = ParseStack(result.stack);
            const balance = parsedStack[0].type === 'int' ? parsedStack[0].value : 0n;
            return balance.toString();
        } catch (_error) {
            // Failed to get jetton balance, return 0
            return '0';
        }
    }

    async getJettonWalletAddress(this: Wallet, jettonAddress: UserFriendlyAddress): Promise<UserFriendlyAddress> {
        if (!isValidAddress(jettonAddress)) {
            throw new Error(`Invalid jetton address: ${jettonAddress}`);
        }

        try {
            // Call get_wallet_address method on jetton master contract
            const result = await this.getClient().runGetMethod(
                jettonAddress,
                'get_wallet_address',
                SerializeStack([
                    { type: 'slice', cell: beginCell().storeAddress(Address.parse(this.getAddress())).endCell() },
                ]),
            );

            const parsedStack = ParseStack(result.stack);

            // Extract the jetton wallet address from the result
            if (!parsedStack || parsedStack.length === 0 || !parsedStack[0]) {
                throw new Error('Empty response from jetton master contract - jetton may not exist');
            }
            const jettonWalletAddress =
                parsedStack[0].type === 'slice' || parsedStack[0].type === 'cell'
                    ? parsedStack[0].cell.asSlice().loadAddress()
                    : null;
            if (!jettonWalletAddress) {
                throw new Error('Failed to get jetton wallet address');
            }
            return asAddressFriendly(jettonWalletAddress.toString());
        } catch (error) {
            throw new Error(
                `Failed to get jetton wallet address for ${jettonAddress}: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    async getJettons(this: Wallet, params?: JettonsRequest): Promise<JettonsResponse> {
        return this.getClient().jettonsByOwnerAddress({
            ownerAddress: this.getAddress(),
            offset: params?.pagination.offset,
            limit: params?.pagination.limit,
        });
    }
}
