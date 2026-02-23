/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isValidAddress } from '../../../utils/address';
import { CallForSuccess } from '../../../utils/retry';
import {
    createJettonTransferPayload,
    createTransferTransaction,
    DEFAULT_JETTON_GAS_FEE,
    storeJettonTransferMessage,
} from '../../../utils/messageBuilders';
import {
    getJettonBalanceFromClient,
    getJettonWalletAddressFromClient,
    getJettonsFromClient,
} from '../../../utils/assetHelpers';
import type { JettonTransferMessage } from '../../../utils/messageBuilders';
import type { Wallet, WalletJettonInterface } from '../../../api/interfaces';
import type {
    JettonsRequest,
    JettonsResponse,
    JettonsTransferRequest,
    TokenAmount,
    TransactionRequest,
    UserFriendlyAddress,
} from '../../../api/models';

// Re-export for backwards compatibility
export { storeJettonTransferMessage };
export type { JettonTransferMessage };

export class WalletJettonClass implements WalletJettonInterface {
    async createTransferJettonTransaction(this: Wallet, params: JettonsTransferRequest): Promise<TransactionRequest> {
        if (!isValidAddress(params.recipientAddress)) {
            throw new Error(`Invalid to address: ${params.recipientAddress}`);
        }
        if (!isValidAddress(params.jettonAddress)) {
            throw new Error(`Invalid jetton address: ${params.jettonAddress}`);
        }
        if (!params.transferAmount || BigInt(params.transferAmount) <= 0n) {
            throw new Error(`Invalid amount: ${params.transferAmount}`);
        }

        const jettonWalletAddress = await CallForSuccess(() => this.getJettonWalletAddress(params.jettonAddress));

        const jettonPayload = createJettonTransferPayload({
            amount: BigInt(params.transferAmount),
            destination: params.recipientAddress,
            responseDestination: await this.getAddress(),
            comment: params.comment,
        });

        return createTransferTransaction({
            targetAddress: jettonWalletAddress,
            amount: DEFAULT_JETTON_GAS_FEE,
            payload: jettonPayload,
            fromAddress: await this.getAddress(),
        });
    }

    async getJettonBalance(this: Wallet, jettonAddress: UserFriendlyAddress): Promise<TokenAmount> {
        const jettonWalletAddress = await this.getJettonWalletAddress(jettonAddress);
        return getJettonBalanceFromClient(await this.getClient(), jettonWalletAddress);
    }

    async getJettonWalletAddress(this: Wallet, jettonAddress: UserFriendlyAddress): Promise<UserFriendlyAddress> {
        return getJettonWalletAddressFromClient(await this.getClient(), jettonAddress, await this.getAddress());
    }

    async getJettons(this: Wallet, params?: JettonsRequest): Promise<JettonsResponse> {
        return getJettonsFromClient(await this.getClient(), await this.getAddress(), params);
    }
}
