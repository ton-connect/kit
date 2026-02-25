/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, beginCell, Cell } from '@ton/core';

import { globalLogger } from '../core/Logger';
import { ERROR_CODES, WalletKitError } from '../errors';
import {
    DEFAULT_JETTON_GAS_FEE,
    DEFAULT_NFT_GAS_FEE,
    DEFAULT_FORWARD_AMOUNT,
    storeJettonTransferMessage,
    storeNftTransferMessage,
} from '../utils/messageBuilders';
import type { Wallet } from '../api/interfaces';
import type {
    TransactionRequest,
    TransactionRequestMessage,
    IntentActionItem,
    SendTonAction,
    SendJettonAction,
    SendNftAction,
    Base64String,
    Network,
} from '../api/models';

const log = globalLogger.createChild('IntentResolver');

/**
 * Resolves intent action items into concrete transaction messages.
 *
 * Responsibilities:
 * - Convert IntentActionItem[] → TransactionRequest (with jetton/NFT body building)
 * - Fetch action URLs and return their resolved payloads
 */
export class IntentResolver {
    /**
     * Convert intent action items into a TransactionRequest.
     * Resolves jetton wallet addresses and builds TEP-74 / TEP-62 message bodies.
     */
    async intentItemsToTransactionRequest(
        items: IntentActionItem[],
        wallet: Wallet,
        network?: Network,
        validUntil?: number,
    ): Promise<TransactionRequest> {
        const messages: TransactionRequestMessage[] = [];

        for (const item of items) {
            const message = await this.resolveItem(item, wallet);
            messages.push(message);
        }

        return {
            messages,
            network,
            validUntil,
            fromAddress: wallet.getAddress(),
        };
    }

    /**
     * Fetch an action URL and return the raw response.
     */
    async fetchActionUrl(actionUrl: string, walletAddress: string): Promise<unknown> {
        const separator = actionUrl.includes('?') ? '&' : '?';
        const url = `${actionUrl}${separator}address=${encodeURIComponent(walletAddress)}`;

        log.info('Fetching action URL', { url });

        const response = await fetch(url);
        if (!response.ok) {
            throw new WalletKitError(
                ERROR_CODES.NETWORK_ERROR,
                `Action URL returned ${response.status}: ${response.statusText}`,
            );
        }

        return response.json();
    }

    // -- Item resolution ------------------------------------------------------

    private async resolveItem(item: IntentActionItem, wallet: Wallet): Promise<TransactionRequestMessage> {
        switch (item.type) {
            case 'sendTon':
                return this.resolveTonItem(item.value);
            case 'sendJetton':
                return this.resolveJettonItem(item.value, wallet);
            case 'sendNft':
                return this.resolveNftItem(item.value, wallet);
        }
    }

    private resolveTonItem(item: SendTonAction): TransactionRequestMessage {
        return {
            address: item.address,
            amount: item.amount,
            payload: item.payload as Base64String | undefined,
            stateInit: item.stateInit as Base64String | undefined,
            extraCurrency: item.extraCurrency,
        };
    }

    private async resolveJettonItem(item: SendJettonAction, wallet: Wallet): Promise<TransactionRequestMessage> {
        const jettonWalletAddress = await wallet.getJettonWalletAddress(item.jettonMasterAddress);

        const forwardPayload = item.forwardPayload ? Cell.fromBase64(item.forwardPayload) : null;
        const customPayload = item.customPayload ? Cell.fromBase64(item.customPayload) : null;

        const body = beginCell()
            .store(
                storeJettonTransferMessage({
                    queryId: BigInt(item.queryId ?? 0),
                    amount: BigInt(item.jettonAmount),
                    destination: Address.parse(item.destination),
                    responseDestination: item.responseDestination
                        ? Address.parse(item.responseDestination)
                        : Address.parse(wallet.getAddress()),
                    customPayload,
                    forwardAmount: item.forwardTonAmount ? BigInt(item.forwardTonAmount) : DEFAULT_FORWARD_AMOUNT,
                    forwardPayload,
                }),
            )
            .endCell();

        return {
            address: jettonWalletAddress,
            amount: DEFAULT_JETTON_GAS_FEE,
            payload: body.toBoc().toString('base64') as Base64String,
        };
    }

    private async resolveNftItem(item: SendNftAction, wallet: Wallet): Promise<TransactionRequestMessage> {
        const forwardPayload = item.forwardPayload ? Cell.fromBase64(item.forwardPayload) : null;
        const customPayload = item.customPayload ? Cell.fromBase64(item.customPayload) : null;

        const body = beginCell()
            .store(
                storeNftTransferMessage({
                    queryId: BigInt(item.queryId ?? 0),
                    newOwner: Address.parse(item.newOwnerAddress),
                    responseDestination: item.responseDestination
                        ? Address.parse(item.responseDestination)
                        : Address.parse(wallet.getAddress()),
                    customPayload,
                    forwardAmount: item.forwardTonAmount ? BigInt(item.forwardTonAmount) : DEFAULT_FORWARD_AMOUNT,
                    forwardPayload,
                }),
            )
            .endCell();

        return {
            address: item.nftAddress,
            amount: DEFAULT_NFT_GAS_FEE,
            payload: body.toBoc().toString('base64') as Base64String,
        };
    }
}
